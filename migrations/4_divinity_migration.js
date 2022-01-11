const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const Divinity = artifacts.require("Divinity");
const eDIVI = artifacts.require("eDIVI");
const Division = artifacts.require("Division");

module.exports = async function (deployer, network, accounts) {
	const token = await eDIVI.deployed();
	const division = await Division.deployed();

	const DIVINITY_ROLE = web3.utils.soliditySha3('DIVINITY_ROLE');

	await deployer.deploy(Divinity, token.address, division.address);
	const divinity = await Divinity.deployed();

	await token.transfer(
		divinity.address, process.env.INITIAL_AMOUNT, 
		{ from: process.env.INITIAL_BENEFICIARY }
	);
	await token.grantRole(DIVINITY_ROLE, divinity.address, { from: process.env.INITIAL_BENEFICIARY });
	await token.renounceRole(
		DIVINITY_ROLE, process.env.INITIAL_BENEFICIARY,
		{ from: process.env.INITIAL_BENEFICIARY }
	);
	// DEFAULT_ADMIN_ROLE (0x00) transfer not included here
}
