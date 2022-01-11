// SPDX-License-Identifier: MIT
// DIVI TBD

pragma solidity ^0.8.7;

import "./interfaces/IDivision.sol";
import "./interfaces/IDivi.sol";
import "./utils/introspection/IERC165.sol";
import "./token/IERC20.sol";
import "./security/IAccessControl.sol";

import "./utils/Context.sol";
import "./utils/Address.sol";


contract Divinity is Context {
	address public token;
	address public division;

	bytes32 public constant DIVINITY_ROLE = keccak256("DIVINITY_ROLE");

	event TokenChanged(address initiator, address oldAddress, address newAddress);
	event DivisionChanged(address initiator, address oldAddress, address newAddress);

	/**
	 * @dev Restrict access to {division} executing address.
	 */
	modifier onlyDivision() {
		require(_msgSender() == division, "DIVINITY: only dicisions from Division");
		_;
	}

	/**
	 * @dev Check the token address for compatibility with the required interfaces.
	 */
	modifier correctToken(address addr) {
		require(addr != address(0), "Divinity: token address could not be zero");
		require(Address.isContract(addr), "Divinity: token address must be smart contract");
		require(IERC165(addr).supportsInterface(type(IERC165).interfaceId), "Divinity: IERC165 not supported");
		require(IERC165(addr).supportsInterface(type(IERC20).interfaceId), "Divinity: IERC20 not supported");
		require(IERC165(addr).supportsInterface(type(IDivi).interfaceId), "Divinity: IERC20Mintable not supported");
		require(IERC165(addr).supportsInterface(type(IAccessControl).interfaceId), "Divinity: IAccessControl not supported");
		_;
	}

	/**
	 * @dev Check the division address for compatibility with the required interfaces.
	 */
	modifier correctDivision(address addr) {
		require(addr != address(0), "Divinity: division address could not be zero");
		require(Address.isContract(addr), "Divinity: division address must be smart contract");
		require(IERC165(addr).supportsInterface(type(IERC165).interfaceId), "Divinity: IERC165 not supported");
		require(IERC165(addr).supportsInterface(type(IDivision).interfaceId), "Divinity IDivision not supported");
		_;
	}

	/**
	 * @dev Sets default {token_} address and {division_} address.
	 *
	 * Note: there is no guarantee that {token_} grant {DIVINITY_ROLE} role for current smart contract.
	 */
	constructor (address token_, address division_) correctToken(token_) correctDivision(division_) {
		token = token_;
		division = division_;
	}

	/**
	 * @dev Sets other division address.
	 *
	 * Requirements:
	 * 
	 * - new {division_} address not equal to previous {division} address
	 */
	function changeDivision(address division_) external onlyDivision correctDivision(division_) {
		require(division != division_, "Divinity: new division address is same");
		address old = division;
		division = division_;

		emit DivisionChanged(_msgSender(), old, division_);
	}
	
	/**
	 * @dev Sets token address.
	 *
	 * Requirements:
	 *
	 * - new {token_} address not equal to {token} address
	 * - current smart contract has {DIVINITY_ROLE} role for the {token_}
	 */
	function changeToken(address token_) external onlyDivision correctToken(token_) {
		require(token != token_, "Divinity: new token address is same");
		require(IAccessControl(token_).hasRole(DIVINITY_ROLE, address(this)), "Divinity: DIVINITY_ROLE is missing");

		address old = token;
		token = token_;

		emit TokenChanged(_msgSender(), old, token_);
	}

	/**
	 * @dev Create new {amount} of {token} for {account}.
	 *
	 * Requirements:
	 *
	 * - current smart contract has {DIVINITY_ROLE} role for the {token_}.
	 * - {account} not zero address.
	 */
	function mint(address account, uint256 amount) external onlyDivision {
		require(IAccessControl(token).hasRole(DIVINITY_ROLE, address(this)), "Divinity: DIVINITY_ROLE is missing");
		require(account != address(0), "Divinity: mint to zero address forbidden");

		IDivi(token).mint(account, amount);
	}

	/**
	 * @dev Burn {amount} of {token} from this address.
	 *
	 * Requirements:
	 *
	 * - current smart contract has {DIVINITY_ROLE} role for the {token_}.
	 * - {amount} fits into balance of this smart contract.
	 */
	function burn(uint256 amount) external onlyDivision {
		require(IAccessControl(token).hasRole(DIVINITY_ROLE, address(this)), "Divinity: DIVINITY_ROLE is missing");
		require(IERC20(token).balanceOf(address(this)) >= amount, "Divinity: amount exceeds balanace");

		IDivi(token).burn(amount);
	}

	/**
	 * @dev Transfer {amount} of {token} to {account}.
	 *
	 * Requirements:
	 *
	 * - {amount} fits into balance of this smart contract. 
	 */
	function transfer(address account, uint256 amount) external onlyDivision returns(bool) {
		require(IERC20(token).balanceOf(address(this)) >= amount, "Divinity: not enough tokens");
		return IERC20(token).transfer(account, amount);
	}
	
	/**
	 * @dev Pause the controlled {token}.
	 *
	 * Requirements:
	 *
	 * - current smart contract has {DIVINITY_ROLE} role for the {token}.
	 */
	function pause() external onlyDivision {
		require(IAccessControl(token).hasRole(DIVINITY_ROLE, address(this)), "Divinity: DIVINITY_ROLE is missing");
		IDivi(token).pause();
	}

	/**
	 * @dev Unause the controlled {token}.
	 *
	 * Requirements:
	 *
	 * - current smart contract has {DIVINITY_ROLE} role for the {token}.
	 */
	function unpause() external onlyDivision {
		require(IAccessControl(token).hasRole(DIVINITY_ROLE, address(this)), "Divinity: DIVINITY_ROLE is missing");
		IDivi(token).unpause();
	}
}
