// SPDX-License-Identifier: MIT
// DIVI TBD

pragma solidity ^0.8.7;

/**
 * @dev Interface of {Division} core.
 */
abstract contract IDivision {
	/**
	 * @dev Emitted when a proposal is created.
	 */
	event ProposalSubmitted(
		uint256 proposalId,
		address proposer,
		address[] targets,
		string[] signatures,
		bytes[] calldatas,
		uint256 endBlock,
		string description
	);

	/**
	 * @dev Emitted when proposal is removed.
	 */
	event ProposalRemoved(
		address indexed sentry,
		uint256 proposalId,
		uint64 blockNumber
	);

	/**
	 * @dev Emitted when proposal is executed.
	 */
	event ProposalExecuted(
		address indexed sentry,
		uint256 proposalId,
		uint64 blockNumber
	);

	/**
	 * @dev Emitted when someone vote for proposal.
	 */
	event ProposalVote(
		address indexed voter, 
		uint256 proposalId, 
		uint64 blockNumber
	);

	/**
	 * @dev Hashing function used to (re)build the proposal id from 
	 * the proposal details..
	 */
	function hashProposal(
		address[] calldata targets,
		bytes[] calldata calldatas,
		bytes32 descriptioinHash
	) external pure virtual returns (uint256);

	/**
     * @dev Block number at which votes close. Votes close at the end of
	 * this block, so it is possible to cast a vote during this block.
     */
	function proposalDeadline(uint256 proposalId) external view virtual returns (uint64);

	/**
	 * @dev Sets {IDivision-votingPeriod} blocks for every proposal to be active.
	 */
	function setVotingPeriod(uint64 votingDelay) external virtual;

	/**
     * @dev Create a new proposal. Vote ends {IDivision-votingPeriod} blocks..
     *
     * Emits a {ProposalCreated} event.
     */
	function submitProposal(
		address[] memory targets,
		bytes[]   memory calldatas,
		string    memory description
	) external virtual returns (uint256 proposalId);

	/**
     * @dev Execute a successful proposal. This requires the votes threshold to 
	 * be reached, the vote to be successful, and the deadline nt been reached.
     *
     * Emits a {ProposalExecuted} event.
     */
	function executeProposal(
		address[] memory targets,
		bytes[]   memory calldatas,
		string    memory descriptionHash
	) external virtual returns (uint256 proposalId);

	/**
	 * Vote for proposal in order to approve it.
	 */
	function voteForProposal(
		address[] memory targets,
		bytes[]   memory calldatas,
		string    memory descriptionHash
	) external virtual returns (uint256 proposalId);
}
