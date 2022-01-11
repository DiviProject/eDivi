// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "../utils/Context.sol";

contract ContextMock is Context {
    event Sender(address sender);

    function msgSender() public {
        emit Sender(_msgSender());
    }

    event Data(bytes data, uint256 integerValue, string stringValue);

}

contract ContextMockCaller {
    function callSender(ContextMock context) public {
        context.msgSender();
    }
}
