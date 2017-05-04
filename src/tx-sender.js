const log = require('minilog')('sender');
require('minilog').enable();

const short = hash => hash.substring(0, 6);

const wasTransactionIncluded = (web3, blockHash, tx) => {
  return web3.eth.getBlock(blockHash).transactions.includes(tx);
};

/**
 * Object passed to {@link Transaction#watch} as filter argument that specifies
 * type of event or blockchain change to watch for.
 * @typedef {Object} TransactionFilter
 * @property {String} event - {@link FincontractMarketplace}'s event to
 *   watch for
 * @property {String} block - Blockchain change to watch for (see {@link Web3},
 *   specifically `web3.eth.filter` for more details)
 */

/** A sent transaction, which can be watched for events. */
export class Transaction {

  /**
   * Constructs {@link Transaction} object with a promise of sent transaction
   * as first argument and the usual context necessary for
   * interacting with blockchain
   * @param  {Promise<String,Error>} sent promise of sent transaction, should be
   *   the return value of {@link Sender#send}
   * @param {FincontractMarketplace} marketplace a Fincontracts smart contract instance
   * @param {Web3} web3 a web3 instance connected to Ethereum node
   */
  constructor(sent, contract, web3) {
    /** @type {Promise<String,Error>} */
    this.sent = sent;
    /** @private */
    this.contract = contract;
    /** @private */
    this.web3 = web3;
  }

  /**
   * Constructs a listener and starts watching for the event to happen.
   * Once the event happens the callback will be executed and the returned
   * promise gets resolved with the callback's return value. If any error
   * happens during the execution, the promise rejects with that error.
   * @param {TransactionFilter} filter a filter object to listen for events
   * @param {Function} callback a callback to be executed once event was
   *   triggered
   * @return {Promise<String,Error>} promise that resolves to the value returned
   *  by the callback
   */
  async watch(filter, callback) {
    let listener = null;
    let predicate = null;
    if (filter.event) {
      const options = {fromBlock: 'latest', toBlock: 'pending'};
      listener = this.contract[filter.event].call(options);
      predicate = (tx, logs) => logs.transactionHash === tx;
    } else if (filter.block) {
      listener = this.web3.eth.filter(filter.block);
      predicate = (tx, logs) => wasTransactionIncluded(this.web3, logs, tx);
    } else {
      this.sent = Promise.reject(Error(`Wrong filter, was: ${filter}`));
      return this;
    }

    function makeListener(tx) {
      return new Promise((resolve, reject) => {
        listener.watch((err, logs) => {
          if (err) {
            reject(Error(`${err} when watching tx: ${tx}`));
            return;
          }
          if (predicate(tx, logs)) {
            listener.stopWatching();
            const yielded = callback(logs);
            resolve(yielded);
          }
        });
      });
    }

    const tx = await this.sent;
    return makeListener(tx);
  }

}

/**
 * Sender class allows for sending Ethereum transactions and returns
 * {@link Transaction} objects that can be then watched for events
 * (see {@link Transaction#watch}).
 */
export default class Sender {

  /**
   * Maximum Gas to be spent in an Ethereum transaction
   * @type {Number}
   */
  static get GasLimit() {
    return 4000000;
  }

  /**
   * Constructs {@link Sender} object with the usual context for interacting with
   * the FincontractMarketplace smart contract instance.
   * @param {FincontractMarketplace} marketplace a Fincontracts smart contract instance
   * @param {Web3} web3 a web3 instance connected to Ethereum node
   */
  constructor(contract, web3) {
    /** @private */
    this.contract = contract;
    /** @private */
    this.web3 = web3;
  }

  /**
   * Sends a transaction to the blockchain using the smart contract instance
   * set within constructor. Name argument is used to retrieve correct function
   * and the arguments are then fed as the arguments of the transaction.
   * Transaction sometimes is lost for unknown reasons. In this case, it will be
   * resent until it's on the list of pending transactions.
   * @param  {String} name a name of the transaction to be sent
   * @param  {Array} args arguments to be fed to that transaction
   * @return {Transaction} transaction object with {@link Transaction.sent} set
   *   to the promise of the sent transaction
   */
  send(name, args) {
    const executor = (resolve, reject) => {
      const method = this.contract[name];
      method.sendTransaction(...args, {gas: Sender.GasLimit}, (err, tx) => {
        if (err) {
          reject(`${err} at transaction '${name}' with args: ${args}`);
          return;
        }
        log.info(`${name} transaction was sent. HASH: ${short(tx)}`);
        if (!this.web3.eth.getTransaction(tx)) {
          log.warn(`Transaction was lost! HASH: ${short(tx)}`);
          return executor(resolve, reject);
        }
        resolve(tx);
      });
    };
    const sent = new Promise((resolve, reject) => executor(resolve, reject));
    return new Transaction(sent, this.contract, this.web3);
  }

}
