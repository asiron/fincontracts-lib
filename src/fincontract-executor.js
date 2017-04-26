import {FincOrNode} from './fincontract';
import Fetcher from './fincontract-fetcher';
import Sender from './tx-sender';

const TIMEOUT = 240000;

export default class Executor {

  constructor(marketplace, web3) {
    this.web3 = web3;
    this.marketplace = marketplace;
    this.fetcher = new Fetcher(marketplace);
    this.sender = new Sender(marketplace, web3);
  }

  join(fctID) {
    const that = this;
    return this.fetcher
      .pullFincontract(fctID)
      .then(f => {
        const account = this.web3.eth.defaultAccount;
        const newOwner = f.proposedOwner;
        const issued = (newOwner === account) || (parseInt(newOwner, 16) === 0);
        if (!issued) {
          throw new Error('Cannot own this fincontract');
        }
        return f;
      })
      .then(f => {
        const sent = that.sender.send('join', [f.id]);
        return that.watchExecution(sent);
      });
  }

  choose(fctID, choice) {
    const that = this;
    return this.fetcher
      .pullFincontract(fctID)
      .then(f => {
        const isOrNode = (f.rootDescription.children[0] === FincOrNode.construtor);
        if (!isOrNode) {
          throw new Error('Root node of fincontract is not an OR node!');
        }
        const account = this.web3.eth.defaultAccount;
        const isOwner = (account === f.owner);
        if (!isOwner) {
          throw new Error('Only owner can choose a sub-fincontract!');
        }
        return f;
      })
      .then(f => {
        const sent = that.sender.send('executeOr', [f.id, choice]);
        return that.watchExecution(sent);
      });
  }

  watchExecution(sentTransaction) {
    const that = this;
    const executed = sentTransaction.watch({event: 'Executed'}, logs => {
      return Promise.resolve({type: 'executed', id: logs.args.fctId});
    });
    const deferred = sentTransaction.watch({event: 'Deleted'}, logs => {
      return that.processDeferredExecution(logs.args.fctId);
    });
    const timeout = sentTransaction.promise.then(() => new Promise((resolve, reject) => {
      setTimeout(reject, TIMEOUT, Error('Execution timed out! Probably threw!'));
    }));
    return Promise.race([executed, deferred, timeout]);
  }

  processDeferredExecution(deleted) {
    const that = this;
    return new Promise((resolve, reject) => {
      that.marketplace.CreatedBy().get((err, events) => {
        if (err) {
          reject(Error(`${err} when getting new Fincontract ids`));
          return;
        }
        const newFincontracts = events.reduce((x, {args: {fctId}}) => {
          return [...x, fctId];
        }, []);
        resolve({type: 'deferred', deleted, newFincontracts});
      });
    });
  }
}
