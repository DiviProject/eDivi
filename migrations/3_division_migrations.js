const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Division = artifacts.require("Division");

module.exports = async function (deployer, network, accounts) {
	const members   = process.env.DIVISION_MEMBERS.split(',');
	const threshold = process.env.DIVISION_THRESHOLD;
	const period    = process.env.DIVISION_PERIOD;
	
	await deployer.deploy(Division, members, threshold, period);
}
