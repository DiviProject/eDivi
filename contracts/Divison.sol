// SPDX-License-Identifier: MIT
// DIVI TBD

pragma solidity ^0.8.7;

import "./utils/Context.sol";
import "./utils/Address.sol";
import "./utils/Timers.sol";
import "./utils/SafeCast.sol";
import "./utils/introspection/ERC165.sol";
import "./interfaces/IDivision.sol";
import "./security/ReentrancyGuard.sol";

/**
 * @dev Division governance system. Implements {IERC165} and {IDivision}.
 *
 * Division contract should serve as an admin address for other smart contract.
 * The main idea is to create proposals based on the {targets} and {calldatas} for them, 
 * where specific set of admins (division members) will vote for it and execute if votes
 * will reach {threshold}.
 *
 * So this smart contract can do collective decisions that are represented as 
 * a call from this address.
 */
contract Division is Context, ERC165, ReentrancyGuard, IDivision {
	using SafeCast for uint256;
	using Timers for Timers.BlockNumber;

	mapping(address => bool) public divisionMembers;
	mapping(uint256 => mapping(uint64 => mapping(address => bool))) public isVoted;
	mapping(uint256 => Proposal) public proposals;

	uint256 public threshold;
	uint256 public votingPeriod;
	uint256 public divisionMembersLength;

	struct Proposal {
		Timers.BlockNumber end;
		bool executed;
		uint256 votes;
	}

	/**
     * @dev Restrict access to governor executing address.
     */
	modifier onlyDivision() {
		require(_msgSender() == address(this), "Division: only collective decision");
		_;
	}

	/**
     * @dev Availiable only for previously registered division member.
     */
	modifier onlyDivisionMember() {
		require(divisionMembers[_msgSender()], "Division: not a division member");
		_;
	}

	/**
	 * @dev Sets initial {members_}, {threshold_} and basic {period}.
	 *
	 * Requirements:
	 * 
	 * - {period_} not equal to zero.
	 * - array of {members_} not empty.
	 * - {threshold_} not equal to zero and fits to {members_} array length.
	 */
	constructor (address[] memory members_, uint256 threshold_,  uint64 period_) {
		require(period_ > 0, "Division: period must be greater then zero");
		require(members_.length > 0, "Division: division members required");
		require(
			threshold_ > 0 && threshold <= members_.length,
			"Division: invalid number of required confirmations"
		);

		for (uint i = 0; i < members_.length; i++ ) {
			address member = members_[i];

			require(member != address(0), "Division: invalid member");
			require(!divisionMembers[member], "Division: member not unique");

			divisionMembers[member] = true;
		}

		divisionMembersLength = members_.length;
		threshold             = threshold_;
		votingPeriod          = period_;
	}

	/**
     * @dev See {IERC165-supportsInterface}.
     */
	function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
		return interfaceId == type(IDivision).interfaceId || super.supportsInterface(interfaceId);
	}

	/**
	 * @dev See {IDivision-proposalDeadline}
	 */
	function proposalDeadline(uint256 proposalId) external view override returns (uint64) {
		return proposals[proposalId].end.getDeadline();
	}

	/**
	 * @dev External check for current proposal state.
	 */
	function proposalReady(uint256 proposalId) external view returns (bool) {
		Proposal storage proposal = proposals[proposalId];
		return !proposal.executed && proposal.votes >= threshold;
	}

	/**
	 * @dev Function that adds new division member. Could be called only by
	 * this smart contract itself (only through collective decision of existent 
	 * division members).
	 *
	 * This function will increment {threshold} for remaining division members.
	 *
	 * Requirements:
	 *
	 * - {member} address not zero.
	 * - {member} not exist on division member mapping.
	 * - {member} is not s smart contract.
	 */
	function addDivisionMember(address member) external onlyDivision {
		require(member != address(0), "Division: invalid member");
		require(!divisionMembers[member], "Division: member not unique");
		require(!Address.isContract(member), "Division: member not a contract");

		divisionMembers[member] = true;
		divisionMembersLength += 1;
		threshold += 1;
	}

	/**
	 * @dev Function that removes existent division member. Could be called only by
	 * this smart contract itself (only through collective decision of existent 
	 * division members).
	 *
	 * This function will decrement {threshold} for remaining division members only if
	 * it is not the last member in the mapping.
	 *
	 * Requirements:
	 *
	 * - {member} address not zero.
	 * - {member} not exist on division member mapping.
	 * - last {member} could not be removed.
	 */
	function removeDivisionMember(address member) external onlyDivision {
		require(member != address(0), "Division: invalid member");
		require(divisionMembers[member], "Division: member not exists");
		require(divisionMembersLength > 1, "Division: at least one member should exist");

		divisionMembers[member] = false;
		divisionMembersLength -= 1;
		if (threshold > 0) {
			threshold -= 1;
		}
	}

	/**
	 * @dev Explicit change of {threshold}.
	 *
	 * Requirements:
	 *
	 * - new {threshold} must be less then amount of division members.
	 */ 
	function setThreshold(uint256 threshold_) external onlyDivision {
		require(threshold_ <= divisionMembersLength, "Division: too high threshold");
		threshold = threshold_;
	}

	/**
	 * See {IDivision-setVotingPeriod}
	 *
	 * Requirements:
	 *
	 * - new {votingPeriod} not equal ot zero.
	 */
	function setVotingPeriod(uint64 votingPeriod_) external override onlyDivision {
		require(votingPeriod_ > 0, "Division: period must be greater then zero");
		votingPeriod = votingPeriod_;
	}

	/**
	 * @dev Creates a keccak256 of encoded parameters.
	 *
	 * See {IDivision-hashProposal}.
	 */
	function hashProposal(
		address[] memory targets,
		bytes[]   memory calldatas,
		bytes32   description
	) public pure override returns (uint256) {
		return uint256(keccak256(abi.encode(targets, calldatas, description)));
	}

	/**
	 * See {IDivision-submitProposal}
	 *
	 * @dev If proposal is executed, this proposal will be auto-removed (basically nullified).
	 *
	 * Requirements:
	 *
	 * - no empty array for {targets} and {calldatas}.
	 * - {targets} length is equal to {calldatas} length.
	 * - proposal not exists.
	 */
	function submitProposal(
		address[] memory targets,
		bytes[]   memory calldatas,
		string    memory description
	) external override onlyDivisionMember returns (uint256 proposalId) {
		proposalId = hashProposal(targets, calldatas, keccak256(bytes(description)));

		require(targets.length == calldatas.length, "Division: invalid proposal length");
		require(targets.length > 0, "Division: empty proposal");

		Proposal storage proposal = proposals[proposalId];
		if (proposal.executed) {
			proposal.end.reset();
			proposal.votes = 0;
			proposal.executed = false;
		}

		require(proposal.end.isUnset(), "Division: proposal already exists");

		uint64 deadline = block.number.toUint64() + votingPeriod.toUint64();
		proposal.end.setDeadline(deadline);

		emit ProposalSubmitted(
			proposalId,
			_msgSender(),
			targets,
			new string[](targets.length),
			calldatas,
			deadline,
			description
		);
	}

	/**
	 * See {IDivision-voteForProposal}.
	 *
	 * @dev If proposal vote time is expired and votes threshold not reached,
	 * this proposal will be auto-removed (basically nullified).
	 *
	 * Requirements:
	 *
	 * - sender not voted for current proposal yet.
	 * - current proposal not executed yet.
	 * - proposal is previously registered.
	 */
	function voteForProposal(
		address[] memory targets,
		bytes[]   memory calldatas,
		string    memory description
	) external override onlyDivisionMember returns (uint256 proposalId) {
		proposalId = hashProposal(targets, calldatas, keccak256(bytes(description)));
		Proposal storage proposal = proposals[proposalId];
		
		require(
			!isVoted[proposalId][proposal.end.getDeadline()][_msgSender()], 
			"Division: already voted for current proposal"
		);
		require(!proposal.executed, "Division: proposal already executed");
		require(!proposal.end.isUnset(), "Division: proposal not exists");
		
		if (proposal.end.isExpired() && proposal.votes < threshold) {
			proposal.end.reset();
			proposal.votes = 0;
			emit ProposalRemoved(_msgSender(), proposalId, block.number.toUint64());
		} else {
			proposal.votes += 1;
			isVoted[proposalId][proposal.end.getDeadline()][_msgSender()] = true;
			emit ProposalVote(_msgSender(), proposalId, block.number.toUint64());
		}
	}

	/**
	 * See {IDivision-executeProposal}
	 *
	 * Requirements:
	 * 
	 * - proposal votes are enough to reach threshold.
	 * - proposal is not executed yet. 
	 */
	function executeProposal(
		address[] memory targets,
		bytes[]   memory calldatas,
		string    memory description
	) external override nonReentrant onlyDivisionMember returns (uint256 proposalId) {
		proposalId = hashProposal(targets, calldatas, keccak256(bytes(description)));

		Proposal storage proposal = proposals[proposalId];
		require(proposal.votes >= threshold, "Division: not enough votes yet");
		require(!proposal.executed, "Division: already executed");

		proposal.executed = true;
		emit ProposalExecuted(_msgSender(), proposalId, block.number.toUint64());
		
		_execute(targets, calldatas);
	}

	/**
	 * @dev Function that will execute calls in a loop.
	 *
	 * Note: this function could be called only by division members, that are 
	 * theoretically trusted and wise people.
	 *
	 * Due to {Address.verifyCalResult} returns bytes, we need to store it in
	 * a variable and later use in a require statement, in order not to have:
	 *
	 * - function result is unprocessed.
	 * - not used variable.
	 */
	function _execute(
		address[] memory targets,
		bytes[]   memory calldatas
	) internal {
		string memory errorMessage = "Division: call reverted without message";
		for (uint256 i = 0; i < targets.length; ++i) {
			(bool success, bytes memory returnData) = targets[i].call{value: 0}(calldatas[i]);
			bytes memory result = Address.verifyCallResult(success, returnData, errorMessage);
			require(
				result.length == returnData.length && keccak256(result) == keccak256(returnData), 
				"Division: wrong return data"
			); // maybe redundant check
		}
	}
}
