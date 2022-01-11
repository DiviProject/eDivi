// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "../utils/Strings.sol";

contract StringsMock {
    function fromUint256HexFixed(uint256 value, uint256 length) public pure returns (string memory) {
        return Strings.toHexString(value, length);
    }
}
