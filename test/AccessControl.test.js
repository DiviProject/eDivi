const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const {
  shouldBehaveLikeAccessControl,
} = require('./AccessControl.behavior.js');

const AccessControlMock = artifacts.require('eDIVI');

contract('AccessControl', function (accounts) {
  beforeEach(async function () {
    this.accessControl = await AccessControlMock.new(
		process.env.TOKEN_NAME,
		process.env.TOKEN_TICKER,
		process.env.TOKEN_DECIMALS,
		process.env.INITIAL_AMOUNT,
		process.env.INITIAL_BENEFICIARY,
		{ from: accounts[0] }
	);
  });

  shouldBehaveLikeAccessControl('AccessControl', ...accounts);
});
