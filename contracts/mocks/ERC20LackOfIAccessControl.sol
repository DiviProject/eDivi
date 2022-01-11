// SPDX-License-Identifier: MIT
// DIVI license TBD

pragma solidity ^0.8.7;

import "../token/ERC20.sol";

import "../utils/introspection/ERC165.sol";
import "../interfaces/IDivi.sol";

contract ERC20LackOfIAccessControl is ERC20, ERC165, IDivi {
	constructor (
		string memory name_, 
		string memory symbol_,
		uint8 decimals_
	) ERC20(name_, symbol_, decimals_) {}

	function burn(uint256) external override {}

	function mint(address account, uint256 amount) external override {}

	function pause() external override {}

	function unpause() external override {}
}
