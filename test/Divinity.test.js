const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { expectRevert, expectEvent, BN, constants } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;

const Divinity = artifacts.require('Divinity');
const Division = artifacts.require('Division');
const eDIVI    = artifacts.require('eDIVI');

const ERC20LackOf165            = artifacts.require('ERC20LackOf165');
const ERC20LackOfIDivi          = artifacts.require('ERC20LackOfIDivi');
const ERC20LackOfIAccessControl = artifacts.require('ERC20LackOfIAccessControl');
const DivisionLackOfIDivision   = artifacts.require('DivisionLackOfIDivision');
const DivisionLackOf165         = artifacts.require('DivisionLackOf165');

contract('Divinity', function (accounts) {
	describe('token correctness', function () {
		it('eDIVI token fits to Divinity', async function () {
			const token = await eDIVI.new(
				process.env.TOKEN_NAME,
				process.env.TOKEN_TICKER,
				process.env.TOKEN_DECIMALS,
				process.env.INITIAL_AMOUNT,
				process.env.INITIAL_BENEFICIARY
			);
			const division = await Division.new(
				process.env.DIVISION_MEMBERS.split(','),
				process.env.DIVISION_THRESHOLD,
				process.env.DIVISION_PERIOD
			);
			const divinity = await Divinity.new(
				token.contract.options.address,
			division.contract.options.address
			);
			expect(await divinity.token()).to.be.equal(token.contract.options.address);
			expect(await divinity.division()).to.be.equal(division.contract.options.address);
		});

		it('token could not be zero address', async function () {
			const division = await Division.new(
				process.env.DIVISION_MEMBERS.split(','),
				process.env.DIVISION_THRESHOLD,
				process.env.DIVISION_PERIOD
			);
			await expectRevert(
				Divinity.new(
					ZERO_ADDRESS,
					division.contract.options.address
				),
				'Divinity: token address could not be zero'
			);
		});

		it('token must be smart contract', async function () {
			const division = await Division.new(
				process.env.DIVISION_MEMBERS.split(','),
				process.env.DIVISION_THRESHOLD,
				process.env.DIVISION_PERIOD
			);
			await expectRevert(
				Divinity.new(
					accounts[0],
					division.contract.options.address
				),
				'Divinity: token address must be smart contract'
			);
		});
		
		it('token must support IERC165', async function () {
			const token = await ERC20LackOf165.new(
				process.env.TOKEN_NAME,
				process.env.TOKEN_TICKER,
				process.env.TOKEN_DECIMALS
			);
			const division = await Division.new(
				process.env.DIVISION_MEMBERS.split(','),
				process.env.DIVISION_THRESHOLD,
				process.env.DIVISION_PERIOD
			);
			await expectRevert.unspecified(Divinity.new(
				token.contract.options.address,
				division.contract.options.address
			));
		});
		
		it('token must support IDivi', async function () {
			const token = await ERC20LackOfIDivi.new(
				process.env.TOKEN_NAME,
				process.env.TOKEN_TICKER,
				process.env.TOKEN_DECIMALS
			);
			const division = await Division.new(
				process.env.DIVISION_MEMBERS.split(','),
				process.env.DIVISION_THRESHOLD,
				process.env.DIVISION_PERIOD
			);
			await expectRevert(
				Divinity.new(
					token.contract.options.address,
					division.contract.options.address
				),
				'Divinity: IERC20 not supported'
			);
		});
		
		it('token must support IAccessControl', async function () {
			const token = await ERC20LackOfIAccessControl.new(
				process.env.TOKEN_NAME,
				process.env.TOKEN_TICKER,
				process.env.TOKEN_DECIMALS
			);
			const division = await Division.new(
				process.env.DIVISION_MEMBERS.split(','),
				process.env.DIVISION_THRESHOLD,
				process.env.DIVISION_PERIOD
			);
			await expectRevert(
				Divinity.new(
					token.contract.options.address,
					division.contract.options.address
				),
				'Divinity: IERC20 not supported'
			);
		});
	});
	
	describe('division correctness', function () {
		it('current Division fits to Divinity', async function () {
			const token = await eDIVI.new(
				process.env.TOKEN_NAME,
				process.env.TOKEN_TICKER,
				process.env.TOKEN_DECIMALS,
				process.env.INITIAL_AMOUNT,
				process.env.INITIAL_BENEFICIARY
			);
			const division = await Division.new(
				process.env.DIVISION_MEMBERS.split(','),
				process.env.DIVISION_THRESHOLD,
				process.env.DIVISION_PERIOD
			);
			const divinity = await Divinity.new(
				token.contract.options.address,
				division.contract.options.address
			);
			expect(await divinity.token()).to.be.equal(token.contract.options.address);
			expect(await divinity.division()).to.be.equal(division.contract.options.address);
		});
		
		it('Division must support IERC165', async function () {
			const token = await eDIVI.new(
				process.env.TOKEN_NAME,
				process.env.TOKEN_TICKER,
				process.env.TOKEN_DECIMALS,
				process.env.INITIAL_AMOUNT,
				process.env.INITIAL_BENEFICIARY
			);
			const division = await DivisionLackOf165.new(
				process.env.DIVISION_MEMBERS.split(','),
				process.env.DIVISION_THRESHOLD,
				process.env.DIVISION_PERIOD
			);
			await expectRevert.unspecified(
				Divinity.new(
					token.contract.options.address,
					division.contract.options.address
				)
			);
		});
		
		it('Division must support IDivision', async function () {
			const token = await eDIVI.new(
				process.env.TOKEN_NAME,
				process.env.TOKEN_TICKER,
				process.env.TOKEN_DECIMALS,
				process.env.INITIAL_AMOUNT,
				process.env.INITIAL_BENEFICIARY
			);
			const division = await DivisionLackOfIDivision.new(
				process.env.DIVISION_MEMBERS.split(','),
				process.env.DIVISION_THRESHOLD,
				process.env.DIVISION_PERIOD
			);
			await expectRevert(
				Divinity.new(
					token.contract.options.address,
					division.contract.options.address
				), 
				'Divinity IDivision not supported'
			);
		});
	});
	
	describe('only division', function () {
		beforeEach(async function () {
			this.token = await eDIVI.new(
				process.env.TOKEN_NAME,
				process.env.TOKEN_TICKER,
				process.env.TOKEN_DECIMALS,
				process.env.INITIAL_AMOUNT,
				process.env.INITIAL_BENEFICIARY
			);
			this.division = await Division.new(
				[ accounts[0] ],
				[ '1' ],
				process.env.DIVISION_PERIOD
			);
			this.divinity = await Divinity.new(
				this.token.contract.options.address,
				this.division.contract.options.address
			);

			this.DIVINITY_ROLE = web3.utils.soliditySha3('DIVINITY_ROLE');
			await this.token.transfer(
				this.divinity.contract.options.address, process.env.INITIAL_AMOUNT,
				{ from: process.env.INITIAL_BENEFICIARY }
			);
			await this.token.grantRole(
				this.DIVINITY_ROLE, this.divinity.contract.options.address, 
				{ from: process.env.INITIAL_BENEFICIARY }
			);
			await this.token.renounceRole(
				this.DIVINITY_ROLE, process.env.INITIAL_BENEFICIARY,
				{ from: process.env.INITIAL_BENEFICIARY }
			);
		});

		it('token could be changed', async function () {
			const otherToken = await eDIVI.new(
				process.env.TOKEN_NAME,
				process.env.TOKEN_TICKER,
				process.env.TOKEN_DECIMALS,
				process.env.INITIAL_AMOUNT,
				process.env.INITIAL_BENEFICIARY
			);
			await otherToken.grantRole(this.DIVINITY_ROLE, this.divinity.contract.options.address);
			await this.division.submitProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.changeToken(otherToken.contract.options.address).encodeABI() ],
				'<proposal description>'
			);
			await this.division.voteForProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.changeToken(otherToken.contract.options.address).encodeABI() ],
				'<proposal description>'
			);
			await this.division.executeProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.changeToken(otherToken.contract.options.address).encodeABI() ],
				'<proposal description>'
			);
			expect(await this.divinity.token()).to.be.equal(otherToken.contract.options.address);
		});
		
		it('division could be changed', async function () {
			const otherDivision = await Division.new(
				[ accounts[0] ],
				[ '1' ],
				process.env.DIVISION_PERIOD
			);
			await this.division.submitProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.changeDivision(otherDivision.contract.options.address).encodeABI() ],
				'<proposal description>'
			);
			await this.division.voteForProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.changeDivision(otherDivision.contract.options.address).encodeABI() ],
				'<proposal description>'
			);
			await this.division.executeProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.changeDivision(otherDivision.contract.options.address).encodeABI() ],
				'<proposal description>'
			);
			expect(await this.divinity.division()).to.be.equal(otherDivision.contract.options.address);
		});
		
		it('Division must have "DIVINITY_ROLE" on token side', async function () {
			const otherToken = await eDIVI.new(
				process.env.TOKEN_NAME,
				process.env.TOKEN_TICKER,
				process.env.TOKEN_DECIMALS,
				process.env.INITIAL_AMOUNT,
				process.env.INITIAL_BENEFICIARY
			);
			await this.division.submitProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.changeToken(otherToken.contract.options.address).encodeABI() ],
				'<proposal description>'
			);
			await this.division.voteForProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.changeToken(otherToken.contract.options.address).encodeABI() ],
				'<proposal description>'
			);
			await expectRevert(
				this.division.executeProposal(
					[ this.divinity.contract.options.address ],
					[ this.divinity.contract.methods.changeToken(otherToken.contract.options.address).encodeABI() ],
					'<proposal description>'
				), 'Divinity: DIVINITY_ROLE is missing'
			);
			expect(await this.divinity.token()).to.be.equal(this.token.contract.options.address);
		});
		
		it('division address could not be zero', async function () {
			await this.division.submitProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.changeDivision(ZERO_ADDRESS).encodeABI() ],
				'<proposal description>'
			);
			await this.division.voteForProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.changeDivision(ZERO_ADDRESS).encodeABI() ],
				'<proposal description>'
			);
			await expectRevert(
				this.division.executeProposal(
					[ this.divinity.contract.options.address ],
					[ this.divinity.contract.methods.changeDivision(ZERO_ADDRESS).encodeABI() ],
					'<proposal description>'
				), 'Divinity: division address could not be zero'
			);
			expect(await this.divinity.division()).to.be.equal(this.division.contract.options.address);
		});
		
		it('division address must be smart contract', async function () {
			await this.division.submitProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.changeDivision(accounts[0]).encodeABI() ],
				'<proposal description>'
			);
			await this.division.voteForProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.changeDivision(accounts[0]).encodeABI() ],
				'<proposal description>'
			);
			await expectRevert(
				this.division.executeProposal(
					[ this.divinity.contract.options.address ],
					[ this.divinity.contract.methods.changeDivision(accounts[0]).encodeABI() ],
					'<proposal description>'
				), 'Divinity: division address must be smart contract'
			);
			expect(await this.divinity.division()).to.be.equal(this.division.contract.options.address);
		});
	});
	
	describe('token manipulation', function () {
		beforeEach(async function () {
			this.token = await eDIVI.new(
				process.env.TOKEN_NAME,
				process.env.TOKEN_TICKER,
				process.env.TOKEN_DECIMALS,
				process.env.INITIAL_AMOUNT,
				process.env.INITIAL_BENEFICIARY
			);
			this.division = await Division.new(
				[ accounts[0] ],
				[ '1' ],
				process.env.DIVISION_PERIOD
			);
			this.divinity = await Divinity.new(
				this.token.contract.options.address,
				this.division.contract.options.address
			);

			this.DIVINITY_ROLE = web3.utils.soliditySha3('DIVINITY_ROLE');
			await this.token.transfer(
				this.divinity.contract.options.address, process.env.INITIAL_AMOUNT,
				{ from: process.env.INITIAL_BENEFICIARY }
			);
			await this.token.grantRole(
				this.DIVINITY_ROLE, this.divinity.contract.options.address, 
				{ from: process.env.INITIAL_BENEFICIARY }
			);
			await this.token.renounceRole(
				this.DIVINITY_ROLE, process.env.INITIAL_BENEFICIARY,
				{ from: process.env.INITIAL_BENEFICIARY }
			);
		});
	
		it('Division can mint new tokens to Divinity', async function () {
			const total = new BN(process.env.INITIAL_AMOUNT);
			expect(await this.token.totalSupply()).to.be.bignumber.equal(total);
			await this.division.submitProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.mint(this.divinity.contract.options.address, total).encodeABI() ],
				'<proposal description>'
			);
			await this.division.voteForProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.mint(this.divinity.contract.options.address, total).encodeABI() ], 
				'<proposal description>'
			);
			await this.division.executeProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.mint(this.divinity.contract.options.address, total).encodeABI() ],
				'<proposal description>'
			);
			expect(await this.token.totalSupply()).to.be.bignumber.equal(total.mul(new BN('2')));
		});
		
		it('Division can mint new tokens to account', async function () {
			const total = new BN(process.env.INITIAL_AMOUNT);
			expect(await this.token.totalSupply()).to.be.bignumber.equal(total);
			expect(await this.token.balanceOf(accounts[0])).to.be.bignumber.equal(new BN('0'));
			await this.division.submitProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.mint(accounts[0], total).encodeABI() ],
				'<proposal description>'
			);
			await this.division.voteForProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.mint(accounts[0], total).encodeABI() ], 
				'<proposal description>'
			);
			await this.division.executeProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.mint(accounts[0], total).encodeABI() ],
				'<proposal description>'
			);
			expect(await this.token.totalSupply()).to.be.bignumber.equal(total.mul(new BN('2')));
			expect(await this.token.balanceOf(accounts[0])).to.be.bignumber.equal(total);
		});
		
		it('Division can burn tokens from Divinity', async function () {
			const total = new BN(process.env.INITIAL_AMOUNT);
			expect(await this.token.totalSupply()).to.be.bignumber.equal(total);
			await this.division.submitProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.burn(total).encodeABI() ],
				'<proposal description>'
			);
			await this.division.voteForProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.burn(total).encodeABI() ], 
				'<proposal description>'
			);
			await this.division.executeProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.burn(total).encodeABI() ],
				'<proposal description>'
			);
			expect(await this.token.totalSupply()).to.be.bignumber.equal(total.mul(new BN('0')));
		});
		
		it('Division can transfer tokens from Divinity', async function () {
			const total = new BN(process.env.INITIAL_AMOUNT);
			const address = this.divinity.contract.options.address;

			expect(await this.token.balanceOf(address)).to.be.bignumber.equal(total);
			expect(await this.token.balanceOf(accounts[0])).to.be.bignumber.equal(new BN('0'));
			await this.division.submitProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.transfer(accounts[0], total).encodeABI() ],
				'<proposal description>'
			);
			await this.division.voteForProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.transfer(accounts[0], total).encodeABI() ], 
				'<proposal description>'
			);
			await this.division.executeProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.transfer(accounts[0], total).encodeABI() ],
				'<proposal description>'
			);
			expect(await this.token.balanceOf(address)).to.be.bignumber.equal(new BN('0'));
			expect(await this.token.balanceOf(accounts[0])).to.be.bignumber.equal(total);
		});
		
		it('Division can pause token', async function () {
			expect(await this.token.paused()).to.be.equal(false);
			await this.division.submitProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.pause().encodeABI() ],
				'<proposal description>'
			);
			await this.division.voteForProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.pause().encodeABI() ], 
				'<proposal description>'
			);
			await this.division.executeProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.pause().encodeABI() ],
				'<proposal description>'
			);
			expect(await this.token.paused()).to.be.equal(true);
		});
		
		it('Division can unpause token', async function () {
			expect(await this.token.paused()).to.be.equal(false);
			await this.division.submitProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.pause().encodeABI() ],
				'<proposal description>'
			);
			await this.division.voteForProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.pause().encodeABI() ], 
				'<proposal description>'
			);
			await this.division.executeProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.pause().encodeABI() ],
				'<proposal description>'
			);
			expect(await this.token.paused()).to.be.equal(true);
			await this.division.submitProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.unpause().encodeABI() ],
				'<proposal description>'
			);
			await this.division.voteForProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.unpause().encodeABI() ], 
				'<proposal description>'
			);
			await this.division.executeProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.unpause().encodeABI() ],
				'<proposal description>'
			);
			expect(await this.token.paused()).to.be.equal(false);
		});
	});

	describe('malicious user', function () {
		beforeEach(async function () {
			this.token = await eDIVI.new(
				process.env.TOKEN_NAME,
				process.env.TOKEN_TICKER,
				process.env.TOKEN_DECIMALS,
				process.env.INITIAL_AMOUNT,
				process.env.INITIAL_BENEFICIARY
			);
			this.division = await Division.new(
				[ accounts[0] ],
				[ '1' ],
				process.env.DIVISION_PERIOD
			);
			this.divinity = await Divinity.new(
				this.token.contract.options.address,
				this.division.contract.options.address
			);

			this.DIVINITY_ROLE = web3.utils.soliditySha3('DIVINITY_ROLE');
			await this.token.transfer(
				this.divinity.contract.options.address, process.env.INITIAL_AMOUNT,
				{ from: process.env.INITIAL_BENEFICIARY }
			);
			await this.token.grantRole(
				this.DIVINITY_ROLE, this.divinity.contract.options.address, 
				{ from: process.env.INITIAL_BENEFICIARY }
			);
			await this.token.renounceRole(
				this.DIVINITY_ROLE, process.env.INITIAL_BENEFICIARY,
				{ from: process.env.INITIAL_BENEFICIARY }
			);
		});
	
		it('could not mint', async function () {
			await expectRevert.unspecified(this.token.mint(accounts[0], '1'));
			await expectRevert(
				this.divinity.mint(accounts[0], '1'),
				'DIVINITY: only dicisions from Division'
			);
			expect(await this.token.totalSupply())
				.to.be.bignumber.equal(new BN(process.env.INITIAL_AMOUNT));
		});

		it('could not transfer from Divinity', async function () {
			await expectRevert(
				this.divinity.transfer(accounts[0], new BN(process.env.INITIAL_AMOUNT)),
				'DIVINITY: only dicisions from Division'
			);
			expect(await this.token.balanceOf(this.divinity.contract.options.address))
				.to.be.bignumber.equal(new BN(process.env.INITIAL_AMOUNT));
		});

		it('could not burn from Divinity', async function () {
			await expectRevert(
				this.divinity.burn(new BN(process.env.INITIAL_AMOUNT)),
				'DIVINITY: only dicisions from Division'
			)
			expect(await this.token.totalSupply())
				.to.be.bignumber.equal(new BN(process.env.INITIAL_AMOUNT));
		});
		
		it('could not pause token', async function () {
			expect(await this.token.paused()).to.be.equal(false);
			await expectRevert(this.divinity.pause(), 'DIVINITY: only dicisions from Division');
			await expectRevert.unspecified(this.token.pause());
			expect(await this.token.paused()).to.be.equal(false);
		});
		
		it('could not unpuase token', async function () {
			expect(await this.token.paused()).to.be.equal(false);

			await this.division.submitProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.pause().encodeABI() ],
				'<proposal description>'
			);
			await this.division.voteForProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.pause().encodeABI() ],
				'<proposal description>'
			);
			await this.division.executeProposal(
				[ this.divinity.contract.options.address ],
				[ this.divinity.contract.methods.pause().encodeABI() ],
				'<proposal description>'
			);

			expect(await this.token.paused()).to.be.equal(true);
			await expectRevert(this.divinity.unpause(), 'DIVINITY: only dicisions from Division');
			await expectRevert.unspecified(this.token.unpause());
			expect(await this.token.paused()).to.be.equal(true);
		});
		
		it('could not change Division', async function () {
			const otherDivision = await Division.new(
				process.env.DIVISION_MEMBERS.split(','),
				process.env.DIVISION_THRESHOLD,
				process.env.DIVISION_PERIOD
			);
			await expectRevert(
				this.divinity.changeDivision(otherDivision.contract.options.address), 
				'DIVINITY: only dicisions from Division'
			);
			expect(await this.divinity.division())
				.to.be.bignumber.equal(this.division.contract.options.address);
		});
		
		it('could not change token', async function () {
			const otherToken = await eDIVI.new(
				process.env.TOKEN_NAME,
				process.env.TOKEN_TICKER,
				process.env.TOKEN_DECIMALS,
				process.env.INITIAL_AMOUNT,
				process.env.INITIAL_BENEFICIARY
			);
			await expectRevert(
				this.divinity.changeToken(otherToken.contract.options.address), 
				'DIVINITY: only dicisions from Division'
			);
			expect(await this.divinity.token())
				.to.be.equal(this.token.contract.options.address);
		});
	});
});
