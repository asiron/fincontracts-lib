const GAS = 4000000;

export class Sender {
  constructor(contract, web3) {
    this.contract = contract;
    this.web3 = web3;
  }

  send(name, args, eventOptions, block) {
    const that = this;
    const executor = (resolve, reject) => {
      const tx = that.contract[name].sendTransaction(...args, {gas: GAS}, (err, tx) => {
        if (!err) {
          console.log(name + ' transaction was sent. HASH: ' + tx);
          if (!that.web3.eth.getTransaction(tx)) {
            console.log(tx + " transaction was lost! Resending...");
            return executor(resolve, reject);          
          }
          that.watch(eventOptions, block)(tx, resolve, reject);
        } else {
          reject(err + ' at transaction \'' + name + '\' with args: ' + args);
        }
      });
    };
    return new Promise((resolve, reject) => executor(resolve, reject));
  }

  watch(options, block) {
    let listener = null;
    if (options.event)
      listener = this.contract[options.event];
    else if (options.filter)
      listener = this.web3.eth.filter(options.filter);
    else 
      return Promise.reject('Wrong filter/event, was: ' + options.filter);

    return (tx, resolve, reject) => {
      listener = listener.call({fromBlock : 'latest', toBlock : 'pending'});
      listener.watch((err, logs) => {
        if (err) {
          reject(err + 'when watching tx: ' + tx);
          return;
        }
        if (logs.transactionHash == tx) {
          listener.stopWatching();
          const yielded = block(logs);
          resolve(yielded);
        }
      });        
    }
  }

}
