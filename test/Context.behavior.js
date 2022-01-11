const { BN, expectEvent } = require('@openzeppelin/test-helpers');

const ContextMock = artifacts.require('ContextMock');

function shouldBehaveLikeRegularContext (sender) {
  describe('msgSender', function () {
    it('returns the transaction sender when called from an EOA', async function () {
      const { logs } = await this.context.msgSender({ from: sender });
      expectEvent.inLogs(logs, 'Sender', { sender });
    });

    it('returns the transaction sender when from another contract', async function () {
      const { tx } = await this.caller.callSender(this.context.address, { from: sender });
      await expectEvent.inTransaction(tx, ContextMock, 'Sender', { sender: this.caller.address });
    });
  });
}

module.exports = {
  shouldBehaveLikeRegularContext,
};
