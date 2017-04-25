const log = require('minilog')('sender');
require('minilog').enable();

const GAS = 4700000;

const wasTransactionIncluded = (web3, blockHash, tx) => {
  return web3.eth.getBlock(blockHash).transactions.includes(tx);
};

class Transaction {
  constructor(promise, contract, web3) {
    this.promise = promise;
    this.contract = contract;
    this.web3 = web3;
  }

  watch(filter, callback) {
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
      this.promise = Promise.reject(Error(`Wrong filter, was: ${filter}`));
      return this;
    }

    return this.promise.then(tx => {
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
    });
  }
}

export default class Sender {
  constructor(contract, web3) {
    this.contract = contract;
    this.web3 = web3;
  }

  send(name, args) {
    const that = this;
    const executor = (resolve, reject) => {
      const method = that.contract[name];
      method.sendTransaction(...args, {gas: GAS}, (err, tx) => {
        if (err) {
          reject(`${err} at transaction '${name}' with args: ${args}`);
          return;
        }
        log.info(`${name} transaction was sent. HASH: ${tx}`);
        if (!that.web3.eth.getTransaction(tx)) {
          log.warn(`Transaction was lost! HASH: ${tx}`);
          return executor(resolve, reject);
        }
        resolve(tx);
      });
    };
    const promise = new Promise((resolve, reject) => executor(resolve, reject));
    return new Transaction(promise, this.contract, this.web3);
  }

}
