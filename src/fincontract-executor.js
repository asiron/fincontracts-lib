import GatewayUpdater from './fincontract-gateway-updater';
import Fetcher from './fincontract-fetcher';
import Sender from './tx-sender';
import {EmptyVisitor} from './fincontract-visitor';

const TIMEOUT = 90 * 1000;

class OrNodeChecker extends EmptyVisitor {

  processOrNode() {
    return true;
  }

  processTimeboundNode(node, child) {
    return child;
  }

  processScaleNode(node, child) {
    return child;
  }
}

const isOrNode = root => new OrNodeChecker().visit(root);

export default class Executor {

  constructor(marketplace, web3) {
    this.web3 = web3;
    this.marketplace = marketplace;
    this.fetcher = new Fetcher(marketplace);
    this.sender = new Sender(marketplace, web3);
  }

  async join(fctID) {
    const f = await this.pullThenUpdateGateways(fctID);
    const account = this.web3.eth.defaultAccount;
    const newOwner = f.proposedOwner;
    const issued = (newOwner === account) || (parseInt(newOwner, 16) === 0);
    if (!issued) {
      throw new Error('Cannot own this fincontract');
    }
    const sent = this.sender.send('join', [f.id]);
    return this.watchExecution(sent);
  }

  async choose(fctID, choice) {
    const f = await this.pullThenUpdateGateways(fctID);
    if (!isOrNode(f.rootDescription)) {
      throw new Error('Root node of fincontract is not an OR node!');
    }
    const account = this.web3.eth.defaultAccount;
    const isOwner = (account === f.owner);
    if (!isOwner) {
      throw new Error('Only owner can choose a sub-fincontract!');
    }
    const sent = this.sender.send('executeOr', [f.id, choice]);
    return this.watchExecution(sent);
  }

  async watchExecution(sentTransaction) {
    const executed = sentTransaction.watch({event: 'Executed'}, logs => {
      return {type: 'executed', id: logs.args.fctId};
    });
    const deferred = sentTransaction.watch({event: 'Deleted'}, logs => {
      return this.processDeferredExecution(logs.args.fctId);
    });
    await sentTransaction.promise;
    const timeout = new Promise((resolve, reject) => {
      setTimeout(reject, TIMEOUT, Error('Execution timed out! Probably threw!'));
    });
    return Promise.race([executed, deferred, timeout]);
  }

  processDeferredExecution(deleted) {
    return new Promise((resolve, reject) => {
      this.marketplace.CreatedBy().get((err, events) => {
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

  async pullThenUpdateGateways(fctID) {
    const f = await this.fetcher.pullFincontract(fctID);
    const gu = new GatewayUpdater(this.web3);
    await gu.updateAllGateways(f.rootDescription);
    return f;
  }
}
