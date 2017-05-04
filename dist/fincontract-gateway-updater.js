'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GatewayVisitor = undefined;

var _fincontractVisitor = require('./fincontract-visitor');

var _txSender = require('./tx-sender');

var _txSender2 = _interopRequireDefault(_txSender);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = require('minilog')('gateway-updater');
require('minilog').enable();

const short = hash => hash.substring(0, 6);

/**
 * {@link GatewayVisitor} performs the actual Gateway update by traversing
 * the {@link FincNode} description tree. It extends {@link CollectingVisitor},
 * in order to receive a list of Promises that resolve when Gateways are updated.
 * @extends {CollectingVisitor}
 */
class GatewayVisitor extends _fincontractVisitor.CollectingVisitor {

  /**
   * Constructs the {@link GatewayVisitor} object with a web3 instance
   * connected to an Ethereum node and a Gateway smart contract instance not
   * connected to any address
   * @param {Web3} web3 a web3 instance connected to an Ethereum node
   * @param {Gateway} gateway a gateway instance not connected to any address
   */
  constructor(web3, gateway) {
    super();
    /** @private */
    this.web3 = web3;
    /** @private */
    this.gateway = gateway;
  }

  /**
   * Updates a single Gateway. Gateway must conform to Gateway interface defined
   * in {@link FincontractMarketplace}
   * @throws {Error} If address is `0x0`
   * @param  {String} address - 32-byte address of a Gateway to be updated
   * @param  {String} type - type of a Gateway: `If` or `ScaleObs` for
   *   logging purposes
   * @return {Promise<null,Error>} - promise which resolve to nothing if
   *   the Gateway was correctly update or rejects with an Error if the address
   *   was `0x0`
   */
  updateGateway(address, type) {
    if (!parseInt(address, 16)) {
      throw new Error(`Gateway's address was 0x0`);
    }
    const gw = this.gateway.at(address);
    return new _txSender2.default(gw, this.web3).send('update', []).watch({ block: 'latest' }, () => {
      log.info(`Finished updating ${type} gateway at: ${short(address)}`);
    });
  }

  /**
   * Called during preorder traversal when processing {@link FincIfNode}.
   * Updates the current node's Gateway and returns a Promise list
   * to the parent node.
   * @override
   * @param  {FincNode} node  - node currently being processed
   * @param  {Array<Promise>} left  - an Array of Promises containing
   *   Gateway updates from processing left child (first subtree)
   *   of the current node
   * @param  {Array<Promise>} right - an Array of Promises containing
   *   Gateway updates from processing right child (second subtree)
   *   of the current node
   * @return {Array} an Array of Promises containing the Promise that updates
   *   Gateway of the current node concatenated with the Promise lists of its
   *   children
   */
  processIfNode(node, left, right) {
    const self = this.updateGateway(node.gatewayAddress, 'If');
    return [...left, ...right, self];
  }

  /**
   * Called during preorder traversal when processing {@link FincScaleObsNode}.
   * Updates the current node's Gateway and returns a Promise list
   * to the parent node.
   * @override
   * @param  {FincNode} node  - node currently being processed
   * @param  {Array<Promise>} child  - an Array of Promises containing
   *   Gateway updates from processing its only child (its subtree)
   * @return {Array} an Array of Promises containing the Promise that updates
   *   Gateway of the current node concatenated with the Promise list of its
   *   child
   */
  processScaleObsNode(node, child) {
    const self = this.updateGateway(node.gatewayAddress, 'ScaleObs');
    return [...child, self];
  }
}

exports.GatewayVisitor = GatewayVisitor; /**
                                          * {@link GatewayUpdater} updates Gateways contained inside Fincontract instance
                                          * (see {@link Fincontract.rootDescription}). The actual traversal and
                                          * update is done by {@link GatewayVisitor}.
                                          * @example
                                          * import Fetcher from './fincontract-fetcher';
                                          * import GatewayUpdater from './fincontract-gateway-updater';
                                          * try {
                                          *   const fctID = '<32-byte address of blockchain deployed Fincontract>'
                                          *   const gu = new GatewayUpdater(web3, gateway);
                                          *   const fetcher = new Fetcher(marketplace);
                                          *   const f = await fetcher.pullFincontract(fctID);
                                          *   await gu.updateAllGateways(f.rootDescription);
                                          * } catch (err) {
                                          *   console.log(err);
                                          * }
                                          */

class GatewayUpdater {

  /**
   * Constructs the {@link GatewayUpdater} object with a web3 instance
   * connected to an Ethereum node and a Gateway smart contract instance not
   * connected to any address
   * @param {Web3} web3 a web3 instance connected to an Ethereum node
   * @param {Gateway} gateway a gateway instance not connected to any address
   */
  constructor(web3, gateway) {
    /** @private */
    this.gv = new GatewayVisitor(web3, gateway);
  }

  /**
   * @param  {FincNode} node - {@link FincNode} description tree
   * @return {Promise<null,Error>} promise that resolves to nothing if all
   *   Gateways were correctly updated or rejects with an Error
   */
  updateAllGateways(node) {
    return Promise.all(this.gv.visit(node));
  }
}
exports.default = GatewayUpdater;