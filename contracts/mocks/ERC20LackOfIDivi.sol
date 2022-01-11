// SPDX-License-Identifier: MIT
// DIVI license TBD

pragma solidity ^0.8.7;

import "../token/ERC20.sol";

import "../utils/introspection/ERC165.sol";

contract ERC20LackOfIDivi is ERC20, ERC165 {
	constructor (
		string memory name_, 
		string memory symbol_,
		uint8 decimals_
	) ERC20(name_, symbol_, decimals_) {}
}
