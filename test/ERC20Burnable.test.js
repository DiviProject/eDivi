const { BN } = require('@openzeppelin/test-helpers');

const { shouldBehaveLikeERC20Burnable } = require('./ERC20Burnable.behavior');
const ERC20BurnableMock = artifacts.require('eDIVI');

contract('ERC20Burnable', function (accounts) {
  const [ owner, ...otherAccounts ] = accounts;

  const initialBalance = new BN(1000);

  const name = 'Ethereum DIVI';
  const symbol = 'eDIVI';
  const decimals = '8';

  beforeEach(async function () {
    this.token = await ERC20BurnableMock.new(name, symbol, decimals, initialBalance, owner, { from: owner });
  });

  shouldBehaveLikeERC20Burnable(owner, initialBalance, otherAccounts);
});
