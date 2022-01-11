const { 
  BN, constants, expectEvent, expectRevert, 
  ether, balance, send, time 
} = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Division = artifacts.require('Division');
const eDIVI = artifacts.require('eDIVI');

contract('Division', function (accounts) {
  const [ owner, other, voter1, voter2, voter3, voter4 ] = accounts;

  const members = [voter1, voter2, voter3, voter4];
  const threshold = 3;
  const period = 20;

  beforeEach(async function () {
    this.owner = owner;
    this.mock = await Division.new(members, threshold, period);
  });

  const submit = () => {};
  const vote = () => {};
  const execute = () => {};

  it('deployment check', async function () {
    expect(await this.mock.votingPeriod()).to.be.bignumber.equal('20');
    expect(await this.mock.threshold()).to.be.bignumber.equal('3');
    expect(await this.mock.divisionMembersLength()).to.be.bignumber.equal('4');
  });

  describe('NOT a division member', function () {
    it('submit proposal is forbidden', async function () {
      await expectRevert(this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.addDivisionMember(other).encodeABI() ],
        '<proposal description>'
      ), 'Division: not a division member');
    });

    it('vote for proposal if forbidden', async function () {
      await this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('0')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('0')).encodeABI() ],
        '<proposal description>',
        { from: voter2 }
      );
      await expectRevert(this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('0')).encodeABI() ],
        '<proposal description>'
      ), 'Division: not a division member');
    });
    
    it('changing threshold is forbidden', async function () {
      await expectRevert(this.mock.setThreshold(new BN('0')), 'Division: only collective decision');
    });
    
    it('changing voting period is forbidden', async function () {
      await expectRevert(this.mock.setVotingPeriod(new BN('0')), 'Division: only collective decision');
    });
    
    it('chaning voting delay is forbidden', async function () {
      await expectRevert(this.mock.setVotingPeriod(new BN('0')), 'Division: only collective decision');
    });
    
    it('could NOT execute approved transaction', async function () {
      await this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter2 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter3 }
      );
      await expectRevert(this.mock.executeProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>'
      ), 'Division: not a division member');
      expect(await this.mock.votingPeriod()).to.be.bignumber.equal('20');
    });
  });

  describe('only division members', function () {
    it('proposal can be submitted', async function () {
      await this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
    });

    it('multiple proposals can be submitted', async function () {
      await this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('5')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description 2>',
        { from: voter1 }
      );
      await this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
    });

    it('proposal duplication is forbidden', async function () {
      await this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await expectRevert(this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      ), 'Division: proposal already exists');
    });

    it('voting for non-existent proposal is forbidden', async function () {
      await expectRevert(this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      ), 'Division: proposal not exists');
    });
    
    it('submitting of nullified proposal', async function () {
      await this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter2 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter3 }
      );
      await this.mock.executeProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter3 }
      );
      await this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
    });
    
    it('double voting on the same proposal is forbidden', async function () {
      await this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await expectRevert(this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      ), 'Division: already voted for current proposal');
    });

    describe('wrong proposal parameters', function () {
      it('wrong #1', async function() {
        await expectRevert(this.mock.submitProposal(
          [ this.mock.contract.options.address, voter1 ],
          [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
          '<proposal description>',
          { from: voter1 }
        ), 'Division: invalid proposal length');
      });  
      it('wrong #2', async function() {
        await expectRevert(this.mock.submitProposal(
          [ this.mock.contract.options.address ],
          [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI(), this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
          '<proposal description>',
          { from: voter1 }
        ), 'Division: invalid proposal length');
      });  
    });
  });

  describe('collective decision', function () {
    it('approved transaction could be executed', async function() {
      await this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter2 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter3 }
      );
      await this.mock.executeProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      expect(await this.mock.votingPeriod()).to.be.bignumber.equal('1');
    });

    it('transaction without reached threshold is rejected', async function () {
      await this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter2 }
      );
      await expectRevert(this.mock.executeProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      ), 'Division: not enough votes yet');
    });

    it('double execution of the same transaction is forbidden', async function () {
      await this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter2 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter3 }
      );
      await this.mock.executeProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await expectRevert(this.mock.executeProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      ), 'Division: already executed');
    });
    
    it('executed transaction could be nullified', async function () {
      await this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter2 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter3 }
      );
      await this.mock.executeProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
    });
    
    it('voting period could be changed', async function () {
      await this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter2 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter3 }
      );
      await this.mock.executeProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
    });

    it('new member could be added', async function () {
      await this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.addDivisionMember(other).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.addDivisionMember(other).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.addDivisionMember(other).encodeABI() ],
        '<proposal description>',
        { from: voter2 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.addDivisionMember(other).encodeABI() ],
        '<proposal description>',
        { from: voter3 }
      );
      await this.mock.executeProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.addDivisionMember(other).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.setVotingPeriod(new BN('1')).encodeABI() ],
        '<proposal description>',
        { from: other }
      );
    });

    it('any division member could be removed', async function () {
      await this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
        '<proposal description>',
        { from: voter2 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
        '<proposal description>',
        { from: voter3 }
      );
      await this.mock.executeProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await expectRevert(this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      ), 'Reason given: Division: not a division member');
    });

    it('removing last member is forbidden', async function () {
        const mock = await Division.new([voter1], 1, period);
      await mock.submitProposal(
        [ mock.contract.options.address ],
        [ mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await mock.voteForProposal(
        [ mock.contract.options.address ],
        [ mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await expectRevert(mock.executeProposal(
        [ mock.contract.options.address ],
        [ mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      ), 'Division: at least one member should exist');
    });
  });

  describe('timers', function () {
    it('no votes after end', async function () {
        const mock = await Division.new([voter1], 1, 20);
      await mock.submitProposal(
        [ mock.contract.options.address ],
        [ mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      for (let i = 0; i < 22; i++) {
        await time.advanceBlock();
      }
      expectEvent(await mock.voteForProposal(
        [ mock.contract.options.address ],
        [ mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      ), 'ProposalRemoved');
    });
  });

  describe('security', function () {
    it('recursive self-executing is forbidden', async function () {
      await this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.executeProposal(
            [ this.mock.contract.options.address ],
            [ this.mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
          '<proposal description>'
          ).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.executeProposal(
            [ this.mock.contract.options.address ],
            [ this.mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
          '<proposal description>'
          ).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.executeProposal(
            [ this.mock.contract.options.address ],
            [ this.mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
          '<proposal description>'
          ).encodeABI() ],
        '<proposal description>',
        { from: voter2 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.executeProposal(
            [ this.mock.contract.options.address ],
            [ this.mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
          '<proposal description>'
          ).encodeABI() ],
        '<proposal description>',
        { from: voter3 }
      );
      await expectRevert(this.mock.executeProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.executeProposal(
            [ this.mock.contract.options.address ],
            [ this.mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
          '<proposal description>'
          ).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      ), 'ReentrancyGuard: reentrant call');
      await this.mock.submitProposal(
        [ 
          this.mock.contract.options.address,
          this.mock.contract.options.address
        ],
        [ 
          this.mock.contract.methods.removeDivisionMember(voter1).encodeABI(), 
          this.mock.contract.methods.removeDivisionMember(voter2).encodeABI()
        ],
        '<proposal description>',
        { from: voter1 }
      );
    });

    it('receiving ether is forbidden', async function () {
      const receiver = this.mock.contract.options.address;
      const current = await balance.current(receiver);
      await expectRevert.unspecified(send.ether(owner, receiver, ether('1')));
      expect(await balance.current(receiver)).to.be.bignumber.equal(current);
    });

    it('multiple transactions in one call', async function () {
      await this.mock.submitProposal(
        [ 
          this.mock.contract.options.address,
          this.mock.contract.options.address
        ],
        [ 
          this.mock.contract.methods.removeDivisionMember(voter1).encodeABI(), 
          this.mock.contract.methods.removeDivisionMember(voter2).encodeABI()
        ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ 
          this.mock.contract.options.address,
          this.mock.contract.options.address
        ],
        [ 
          this.mock.contract.methods.removeDivisionMember(voter1).encodeABI(), 
          this.mock.contract.methods.removeDivisionMember(voter2).encodeABI()
        ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ 
          this.mock.contract.options.address,
          this.mock.contract.options.address
        ],
        [ 
          this.mock.contract.methods.removeDivisionMember(voter1).encodeABI(), 
          this.mock.contract.methods.removeDivisionMember(voter2).encodeABI()
        ],
        '<proposal description>',
        { from: voter2 }
      );
      await this.mock.voteForProposal(
        [ 
          this.mock.contract.options.address,
          this.mock.contract.options.address
        ],
        [ 
          this.mock.contract.methods.removeDivisionMember(voter1).encodeABI(), 
          this.mock.contract.methods.removeDivisionMember(voter2).encodeABI()
        ],
        '<proposal description>',
        { from: voter3 }
      );
      await this.mock.executeProposal(
        [ 
          this.mock.contract.options.address,
          this.mock.contract.options.address
        ],
        [ 
          this.mock.contract.methods.removeDivisionMember(voter1).encodeABI(), 
          this.mock.contract.methods.removeDivisionMember(voter2).encodeABI()
        ],
        '<proposal description>',
        { from: voter1 }
      );
      await expectRevert(this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      ), 'Division: not a division member');
      await expectRevert(this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
        '<proposal description>',
        { from: voter2 }
      ), 'Division: not a division member');
    });

    it('recursive proposal submission is forbidden', async function () {
      await this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.submitProposal(
            [ this.mock.contract.options.address ],
            [ this.mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
          '<proposal description>'
          ).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.submitProposal(
            [ this.mock.contract.options.address ],
            [ this.mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
          '<proposal description>'
          ).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.submitProposal(
            [ this.mock.contract.options.address ],
            [ this.mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
          '<proposal description>'
          ).encodeABI() ],
        '<proposal description>',
        { from: voter2 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.submitProposal(
            [ this.mock.contract.options.address ],
            [ this.mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
          '<proposal description>'
          ).encodeABI() ],
        '<proposal description>',
        { from: voter3 }
      );
      await expectRevert(this.mock.executeProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.submitProposal(
            [ this.mock.contract.options.address ],
            [ this.mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
          '<proposal description>'
          ).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      ), 'Division: not a division member');;
    });
    
    it('recursive proposal vote is forbidden', async function () {
      await this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.submitProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.voteForProposal(
            [ this.mock.contract.options.address ],
            [ this.mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
          '<proposal description>'
          ).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.voteForProposal(
            [ this.mock.contract.options.address ],
            [ this.mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
          '<proposal description>'
          ).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.voteForProposal(
            [ this.mock.contract.options.address ],
            [ this.mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
          '<proposal description>'
          ).encodeABI() ],
        '<proposal description>',
        { from: voter2 }
      );
      await this.mock.voteForProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.voteForProposal(
            [ this.mock.contract.options.address ],
            [ this.mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
          '<proposal description>'
          ).encodeABI() ],
        '<proposal description>',
        { from: voter3 }
      );
      await expectRevert(this.mock.executeProposal(
        [ this.mock.contract.options.address ],
        [ this.mock.contract.methods.voteForProposal(
            [ this.mock.contract.options.address ],
            [ this.mock.contract.methods.removeDivisionMember(voter1).encodeABI() ],
          '<proposal description>'
          ).encodeABI() ],
        '<proposal description>',
        { from: voter1 }
      ), 'Division: not a division member');;
    });
  });

});
