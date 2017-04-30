import {GatewayInteger} from '../contracts/bin/gatewayint';
import {GatewayBool} from '../contracts/bin/gatewaybool';
import Sender from './tx-sender';

const log = require('minilog')('example');
require('minilog').enable();

/**
 * Examples class is meant to deploy some of the tests defined in 
 * {@link FincontractMarketplace} as well as assign Gateways to global values.
 * It's solely for testing purposes and should be removed once the project is
 * released.
 */
export default class Examples {

  /** @private */
  static get AllExamples() {
    return [
      'simpleTest',
      'complexScaleObsTest',
      'timeboundTest',
      'setGateways',
      'resetGateways'
    ];
  }

  /**
   * Constucts the {@link Examples} object that allows for deployment 
   * of predefined tests
   * @param {FincontractMarketplace} marketplace a Fincontracts smart contract instance
   * @param {Web3} web3 a web3 instance connected to Ethereum node
   */
  constructor(marketplace, web3) {
    /** @private */
    this.marketplace = marketplace;
    /** @private */
    this.web3 = web3;
  }

  /**
   * Runs a predefined function on the blockchain. 
   * See {@link FincontractMarketplace} for more details.
   * @param  {String} name name of the test to be dpeloyed
   * @return {Promise<String, Error>} promise that resolves to fincontract ID or
   *   nothing in case of setting/resetting gateways or it rejects with an Error
   *   in case the transaction has failed
   */
  runExample(name) {
    const noArgExamples = ['simpleTest', 'complexScaleObsTest'];
    if (noArgExamples.includes(name)) {
      return this.deployExample(name, [0x0]);
    } else if (name === 'timeboundTest') {
      const lowerBound = Math.round((Date.now() / 1000) + 120);
      const upperBound = Math.round((Date.now() / 1000) + 3600);
      return this.deployExample('timeboundTest', [0x0, lowerBound, upperBound]);
    } else if (['setGateways', 'resetGateways'].includes(name)) {
      const gatewayint = (name === 'setGateways') ?
        GatewayInteger(this.web3).address : 0;

      const gatewaybool = (name === 'setGateways') ?
        GatewayBool(this.web3).address : 0;

      return this.setGateways(gatewayint, gatewaybool);
    }
    return Promise.reject(Error('Example does not exist!'));
  }

  /**
   * Runs setGatewayI and setGatewayB {@link FincontractMarketplace} functions
   * with specified parameters as addresses to these gateways.
   * @param {String} gatewayint address of GatewayI
   * @param {String} gatewaybool address of GatewayB
   * @return {Promise<String, Error>} promise that resolve to nothing or rejects
   *   with an Error in case transaction has failed
   */
  setGateways(gatewayint, gatewaybool) {
    const p1 = this.deploy('setGatewayI', [gatewayint],
      {block: 'latest'}, () => log.info(`gatewayI set to ${gatewayint}`));
    const p2 = this.deploy('setGatewayB', [gatewaybool],
      {block: 'latest'}, () => log.info(`gatewayB set to ${gatewaybool}`));
    return Promise.all([p1, p2]);
  }

  /**
   * Sends a transaction with proper name and arguments and starts listening
   * to `CreatedBy` event with callback that returns the id of newly created
   * Fincontract. (See {@link Examples#deploy} for more details)
   * @param  {String} name name of the transaction
   * @param  {Array} args arguments of the transaction
   * @return {Promise<String, Error>} promise that resolves to id of the 
   *   newly created fincontract or reject with an Error if it has failed
   */
  deployExample(name, args) {
    return this.deploy(name, args, {event: 'CreatedBy'}, logs => {
      const fctID = logs.args.fctId;
      const owner = logs.args.user;
      log.info(`Fincontract: ${fctID}`);
      log.info(`Created for: ${owner}`);
      return fctID;
    });
  }

  /**
   * Sends a transaction with proper name and arguments and starts watching for
   * an event to happen, which is defined by filter and then triggers the 
   * the callback.
   * @param  {String} name name of the transaction
   * @param  {String} args arguments of the transaction
   * @param  {TransactionFilter} filter a filter object to listen for events
   * @param  {Function} callback a callback to be executed once event was triggered
   * @return {Promise<String,Error>} promise that resolves to the value returned
   *  by the callback
   */
  deploy(name, args, filter, callback) {
    const s = new Sender(this.marketplace, this.web3);
    return s.send(name, args).watch(filter, callback);
  }
}
