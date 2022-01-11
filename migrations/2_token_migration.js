const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { BN } = require('@openzeppelin/test-helpers');
const eDIVI = artifacts.require("eDIVI");

module.exports = async function (deployer) {
	const name           = process.env.TOKEN_NAME;
	const symbol         = process.env.TOKEN_TICKER;
	const decimals       = process.env.TOKEN_DECIMALS;
	const initialAmount  = process.env.INITIAL_AMOUNT;
	const initialAddress = process.env.INITIAL_BENEFICIARY;

	await deployer.deploy(eDIVI, name, symbol, decimals, initialAmount, initialAddress);
}
