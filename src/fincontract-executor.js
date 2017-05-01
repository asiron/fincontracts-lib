import GatewayUpdater from './fincontract-gateway-updater';
import Fetcher from './fincontract-fetcher';
import Sender from './tx-sender';
import {EmptyVisitor} from './fincontract-visitor';

/**
 * Result of executing a Fincontract
 * @typedef {Object} ExecutionResult
 * @property {String} type - type of the result (`executed` | `deferred`)
 * @property {String} deleted - id of the deleted Fincontract (32-byte address)
 * @property {Array<String>|undefined} newFincontracts - list of newly
 *   created Fincontracts if the execution is `deferred`, otherwise undefined
 */

/**
 * {@link OrNodeChecker} checks if there exist path from root node to the
 * nearest Or node (see {@link FincOrNode}), while only passing through
 * {@link FincTimeboundNode} and {@link FincScaleNode}. It's neccessary to check
 * this before choosing a sub-fincontract (see {@link Executor#choose}), since
 * the description tree on the blockchain does not have these explicit
 * node types and rather they are embedded in every node. However, when pulling
 * the contract down (see {@link Fetcher#pullFincontract}) we infer and
 * construct these nodes. If we didn't check this ourselves and the top-level
 * nodes is not an OR node, then the transaction would fail and the gas
 * would not be refunded.
 */
export class OrNodeChecker extends EmptyVisitor {

  /**
   * Called when processing {@link FincOrNode}. Returns true, because we have
   * reached an OR node.
   * @override
   * @return {true}
   */
  processOrNode() {
    return true;
  }

  /**
   * Called when processing {@link FincTimeboundNode}.
   * Passes the child's result to the parent.
   * @override
   * @param  {FincNode} node - currently being processed node
   * @param  {Boolean|null} child - result from processing its child
   * @return {Boolean|null} - result from processing its child
   */
  processTimeboundNode(node, child) {
    return child;
  }

  /**
   * Called when processing {@link FincScaleNode}.
   * Passes the child's result to the parent.
   * @override
   * @param  {FincNode} node - currently being processed node
   * @param  {Boolean|null} child - result from processing its child
   * @return {Boolean|null} - result from processing its child
   */
  processScaleNode(node, child) {
    return child;
  }
}

const isOrNode = root => new OrNodeChecker().visit(root);

/**
 * Executor class is used for executing deployed contracts in
 * {@link FincontractMarketplace}. By executing, we mean 'joining' the contract,
 * which is equivalent to first owning it and then executing. Those two cannot
 * be done separetly. It also allows for choosing `OR` contract
 * (see {@link FincOrNode}).
 * @example
 * import Executor from './fincontract-executor';
 * const exec = new Executor(marketplace, gateway, web3);
 * try {
 *   const executed = await exec.join(id);
 *   console.log(JSON.stringify(executed));
 * } catch (err) {
 *   console.log(err);
 * }
 */
export default class Executor {

  /**
   * Time in seconds to trigger timeout error if nothing has happened. By default
   * it's 90 seconds.
   * @type {Number}
   */
  static get Timeout() {
    return 90 * 1000;
  }

  /**
   * Constructs the {@link Executor} object with Fincontracts smart contract
   * instance, a Gateway smart contract instance not connected to any address
   * and a web3 instance connected to an Ethereum node
   * @param {FincontractMarketplace} marketplace a Fincontracts smart contract instance
   * @param {Gateway} gateway a gateway instance not connected to any address
   * @param {Web3} web3 a web3 instance connected to an Ethereum node
   */
  constructor(marketplace, gateway, web3) {
    /** @private */
    this.web3 = web3;
    /** @private */
    this.marketplace = marketplace;
    /** @private */
    this.gateway = gateway;
    /** @private */
    this.fetcher = new Fetcher(marketplace);
    /** @private */
    this.sender = new Sender(marketplace, web3);
  }

  /**
   * Joins the contract (owns and then executes) as defined in
   * {@link FincontractMarketplace} given the 32-byte address of the
   * blockchain deployed Fincontract. It first updates any gateways contained
   * in the Fincontract and then sends the `join` transaction. For more details
   * see {@link Executor#pullThenUpdateGateways} and
   * {@link GatewayUpdater#updateAllGateways}
   * @throws {Error} If current user cannot own this contract
   * @param  {String} fctID a 32-byte address of the deployed Fincontract
   * @return {Promise<ExecutionResult,Error>} promise returned by
   *   {@link Executor#watchExecution}
   */
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

  /**
   * Chooses a sub-fincontract if the root (top-level) node is an OR node
   * (see {@link FincOrNode}) and then executes it.
   * Similarly to {@link Executor#join} it updates the
   * gateways before proceeding with the actual execution
   * @throws {Error} If current user cannot own this contract
   * @throws {Error} If the root of the fincontract is not an OR node
   * @param  {String} fctID a 32-byte address of the deployed Fincontract
   * @param  {Boolean} choice a choice for the sub-fincontract
   *   (1 signifies selection of the first sub-fincontract, 0 selection of the
   *    second sub-fincontract)
   * @return {Promise<ExecutionResult,Error>} promise returned by
   *   {@link Executor#watchExecution}
   */
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

  /**
   * Begins to watch for events associated with Fincontract execution.
   * The Fincontract's execution can finish successfully (Executed),
   * be postponed (Deferred) or it can timeout (Timeout).
   * <ul>
   *   <li> Executed - happens only if the Fincontract does not contain
   *   any OR nodes and all Timebound nodes have starting time later than now.
   *   (see {@link FincTimeboundNode.lowerBound}) </li>
   *   <li> Deferred - if the above condition is not met, then the Fincontract's
   *   execution will be deferred in time, resulting in new Fincontracts being
   *   created, while the sub-tree which was able to execute completely is
   *   executed and the its payments are enforced. </li>
   *   <li> Timeout - if the transaction throws any error, the timeout will be
   *   triggered after {@link Executor.Timeout} seconds. Errors can throw, because the
   *   gateways have incorrect address, they were incorrectly updated or
   *   the transaction ran out of gas (OOG) due to recursion.
   * </ul>
   * The original Fincontract is always deleted, unless the transaction threw
   * for some reason, then all state changes are reverted as defined by the
   * Ethereum protocol.
   *
   * @param  {Transaction} sentTransaction a sent Transaction object, either
   *   'join' or 'executeOr' (see {@link FincontractMarketplace})
   * @return {Promise<ExecutionResult,Error>} an object containing the result of
   *   the execution or an Error if it timed out.
   */
  async watchExecution(sentTransaction) {
    const executed = sentTransaction.watch({event: 'Executed'}, logs => {
      return {type: 'executed', deleted: logs.args.fctId};
    });
    const deferred = sentTransaction.watch({event: 'Deleted'}, logs => {
      return this.processDeferredExecution(logs.args.fctId);
    });
    await sentTransaction.promise;
    const timeout = new Promise((resolve, reject) => {
      setTimeout(reject, Executor.Timeout, Error('Execution timed out! Probably threw!'));
    });
    return Promise.race([executed, deferred, timeout]);
  }

  /**
   * Processes the deferred execution by fetching all `CreateBy` events
   * (see {@link FincontractMarketplace}), which yield the newly created
   * Fincontracts.
   * @param  {String} deleted - the address of recently deleted Fincontract
   * @return {Promise<ExecutionResult,Error>} promise that resolve to the
   *   results of execution with {@link ExecutionResult.newFincontracts}
   *   containing a list of newly created Fincontract ids or rejects with
   *   an Error if it could not get the ids
   */
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

  /**
   * Pulls a Fincontract from the blockchain given its 32-byte address, then
   * updates all its Gateways, if there are any.
   * @param  {String} fctID - 32-byte address of a deployed Fincontract
   * @return {Fincontract} pulled Fincontract from the blockchain
   */
  async pullThenUpdateGateways(fctID) {
    const f = await this.fetcher.pullFincontract(fctID);
    const gu = new GatewayUpdater(this.web3, this.gateway);
    await gu.updateAllGateways(f.rootDescription);
    return f;
  }
}
