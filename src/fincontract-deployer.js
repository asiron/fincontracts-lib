import DescriptionDeployer from './fincontract-description-deployer';
import Sender from './tx-sender';

const log = require('minilog')('deploy');
require('minilog').enable();

const short = hash => hash.substring(0, 6);

/** @external {Web3} https://github.com/ethereum/wiki/wiki/JavaScript-API */
/** @external {FincontractMarketplace} https://bitbucket.org/s-tikhomirov/fincontracts.git */
/** @external {Gateway} https://bitbucket.org/s-tikhomirov/fincontracts.git */

/**
 * Deployer allows for deployment of {@link Fincontract} to the blockchain in
 * a series of transaction. It makes sure that the topological
 * order of {@link FincNode}s is preserved. It also allows for immediate issuance
 * of the {@link Fincontract} to a given proposed owner.
 * @example
 * import Deployer from './fincontract-deployer';
 * try {
 *   const d = new Deployer(marketplace, web3);
 *   const id = await d.deploy(fincontract);
 * catch (err) {
 *   console.log(err);
 * }
 */
export default class Deployer {

  /**
   * Constructs the {@link Deployer} object with Fincontracts smart contract instance and
   * web3 instance connected to an Ethereum node
   * @param {FincontractMarketplace} marketplace a Fincontracts smart contract instance
   * @param {Web3} web3 a web3 instance connected to an Ethereum node
   */
  constructor(marketplace, web3) {
    /** @private */
    this.dd = new DescriptionDeployer(marketplace, web3);
    /** @private */
    this.sender = new Sender(marketplace, web3);
    /** @private */
    this.marketplace = marketplace;
  }

  /**
   * Deploys a description of a Fincontract to the blockchain by traversing
   * the Fincontract description (See {@link FincNode} and {@link DescriptionDeployer})
   * and returns a promise that resolves to id of the deployed Fincontract.
   * @param  {FincNode} description Root description of {@link Fincontract}
   * @return {Promise.<String, Error>} promise that resolves
   *  to id of blockchain deployed Fincontract or rejects with an error
   */
  async deploy(description) {
    const descID = await this.dd.deployDescription(description);
    return this.deployFincontract(descID);
  }

  /**
   * Deploys a description of a Fincontract to the blockchain
   * (See {@link Deployer#deploy}) and then issues it for the proposed owner.
   * @param  {FincNode} description Root description of {@link Fincontract}
   * @param  {String} proposedOwner address of the proposed owner's Ethereum account
   * @return {Promise.<String, Error>} promise that resolves
   *  to id of blockchain deployed Fincontractor rejects with an error
   */
  async issue(description, proposedOwner) {
    const fctID = await this.deploy(description);
    return this.issueFincontract(fctID, proposedOwner);
  }

  /**
   * Deploys the actual Fincontract to the blockchain given that the description
   * was already deployed and it's id is given as the argument
   * @param  {String} descID Fincontract description's id deployed to the blockchain
   * @return {Promise.<String, Error>} Promise that resolves
   *  to Fincontract's id deployed
   *  to the blockchain or rejects with an error
   */
  deployFincontract(descID) {
    return this.sender
      .send('createFincontract', [descID])
      .watch({event: 'CreatedBy'}, logs => {
        const fctID = logs.args.fctId;
        const owner = logs.args.user;
        log.info(`Fincontract: ${short(fctID)}`);
        log.info(`Created for: ${short(owner)}`);
        return fctID;
      });
  }

  /**
   * Issues the actual Fincontract to the proposed owner in the blockchain
   * given that the Fincontract was already deployed and
   * it's id is given as the argument
   * @param  {String} fctID Fincontract's id deployed to the blockchain
   * @param  {String} proposedOwner address of the proposed owner's Ethereum account
   * @return {Promise.<String, Error>} Promise that resolves
   *  to Fincontract's id deployed to the blockchain or rejects with an error
   */
  issueFincontract(fctID, proposedOwner) {
    return this.sender
      .send('issueFor', [fctID, proposedOwner])
      .watch({event: 'IssuedFor'}, logs => {
        const fctID = logs.args.fctId;
        const proposedOwner = logs.args.proposedOwner;
        log.info(`Fincontract: ${short(fctID)}`);
        log.info(`Issued for:  ${short(proposedOwner)}`);
        return fctID;
      });
  }
}
