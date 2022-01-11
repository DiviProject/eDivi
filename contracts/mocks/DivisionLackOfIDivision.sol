// SPDX-License-Identifier: MIT
// DIVI TBD

pragma solidity ^0.8.7;

import "../utils/introspection/ERC165.sol";

contract DivisionLackOfIDivision is ERC165 {
	mapping(address => bool) public divisionMembers;
    uint256 public threshold;
    uint256 public period;

	constructor (address[] memory members_, uint256 threshold_, uint64 period_) {
        for (uint256 i = 0; i < members_.length; i++) {
            address member = members_[i];
            divisionMembers[member] = true;
        }

        threshold = threshold_;
        period = period_;
    }

}
