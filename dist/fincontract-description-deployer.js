'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _txSender = require('./tx-sender');

var _txSender2 = _interopRequireDefault(_txSender);

var _fincontractVisitor = require('./fincontract-visitor');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = require('minilog')('desc-deploy');
require('minilog').enable();

const short = hash => hash.substring(0, 8);

/**
 * Deploys a Fincontract description to the blockchain by traversing
 * the {@link FincNode} tree in preorder fashion to ensure topological ordering.
 * Extends {@link Visitor} which implements preorder tree traversal.
 * @extends {Visitor}
 */
class DescriptionDeployer extends _fincontractVisitor.Visitor {

  /**
   * Constructs the {@link DescriptionDeployer} object with
   * Fincontracts smart contract instance and web3 instance
   * connected to an Ethereum node
   * @param {FincontractMarketplace} marketplace a Fincontracts smart contract instance
   * @param {Web3} web3 a web3 instance connected to Ethereum node
   */
  constructor(marketplace, web3) {
    super();
    /** @private */
    this.marketplace = marketplace;
    /** @private */
    this.sender = new _txSender2.default(marketplace, web3);
  }

  /**
   * Deploys {@link Fincontract} description (a tree with root located
   * at {@link Fincontract.rootDescription}) to the blockchain using a series
   * of Ethereum transactions and returns a promise which resolves to
   * a description id or it is rejected with an error.
   * @param  {FincNode} root root of the {@link FincNode} tree to be deployed
   * @return {Promise.<String,Error>} promise that resolves to top-level Fincontract's description id
   */
  deployDescription(root) {
    return this.visit(root);
  }

  /**
   * Deploys a single Fincontract primitive to the blockchain
   * @param  {String} name name of the primitive
   * @param  {Array} args arguments fed into primitive's deployment transaction
   * @return {Promise.<String,Error>} promise that resolves to Fincontract primitive's id
   *  deployed to the blockchain or rejects with an error
   */
  deployPrimitive(name, args) {
    return this.sender.send(name, args).watch({ event: 'PrimitiveStoredAt' }, logs => {
      const primitiveId = logs.args.id;
      log.info(`${name} primitive stored with ID: ${short(primitiveId)}`);
      return primitiveId;
    });
  }

  /**
   * Called during preorder traversal when processing {@link FincAndNode}.
   * Deploys the current node and returns a promise to the parent node.
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {Promise<String,Error>} left a Promise containing result of
   *   processing left child (first subtree) of the current node
   * @param  {Promise<String,Error>} right a Promise containing result of
   *   processing right child (second subtree) of the current node
   * @return {Promise.<String,Error>} promise that resolves to the id of the deployed
   *  Fincontract primitive or rejects with an error
   */
  async processAndNode(node, left, right) {
    const children = await Promise.all([left, right]);
    return this.deployPrimitive('And', children);
  }

  /**
   * Called during preorder traversal when processing {@link FincIfNode}.
   * Deploys the current node and returns a promise to the parent node.
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {Promise<String,Error>} left a Promise containing result of
   *   processing left child (first subtree) of the current node
   * @param  {Promise<String,Error>} right a Promise containing result of
   *   processing right child (second subtree) of the current node
   * @return {Promise.<String,Error>} promise that resolves to the id of the deployed
   *  Fincontract primitive or rejects with an error
   */
  async processIfNode(node, left, right) {
    const children = await Promise.all([left, right]);
    const args = [node.gatewayAddress, ...children];
    return this.deployPrimitive('If', args);
  }

  /**
   * Called during preorder traversal when processing {@link FincOrNode}.
   * Deploys the current node and returns a promise to the parent node.
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {Promise<String,Error>} left a Promise containing result of
   *   processing left child (first subtree) of the current node
   * @param  {Promise<String,Error>} right a Promise containing result of
   *   processing right child (second subtree) of the current node
   * @return {Promise.<String,Error>} promise that resolves to the id of the deployed
   *  Fincontract primitive or rejects with an error
   */
  async processOrNode(node, left, right) {
    const children = await Promise.all([left, right]);
    return this.deployPrimitive('Or', children);
  }

  /**
   * Called during preorder traversal when processing {@link FincTimeboundNode}.
   * Deploys the current node and returns a promise to the parent node.
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {Promise<String,Error>} child a Promise containing result of processing
   *   the only child (its subtree) of the current node
   * @return {Promise.<String,Error>} promise that resolves to the id of the deployed
   *  Fincontract primitive or rejects with an error
   */
  async processTimeboundNode(node, child) {
    const args = [node.lowerBound, node.upperBound, await child];
    return this.deployPrimitive('Timebound', args);
  }

  /**
   * Called during preorder traversal when processing {@link FincGiveNode}.
   * Deploys the current node and returns a promise to the parent node.
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {Promise<String,Error>} child a Promise containing result of processing
   *   the only child (its subtree) of the current node
   * @return {Promise.<String,Error>} promise that resolves to the id of the deployed
   *  Fincontract primitive or rejects with an error
   */
  async processGiveNode(node, child) {
    return this.deployPrimitive('Give', [await child]);
  }

  /**
   * Called during preorder traversal when processing {@link FincScaleObsNode}.
   * Deploys the current node and returns a promise to the parent node.
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {Promise<String,Error>} child a Promise containing result of processing
   *   the only child (its subtree) of the current node
   * @return {Promise.<String,Error>} promise that resolves to the id of the deployed
   * Fincontract primitive or rejects with an error
   */
  async processScaleObsNode(node, child) {
    const args = [node.gatewayAddress, await child];
    return this.deployPrimitive('ScaleObs', args);
  }

  /**
   * Called during preorder traversal when processing {@link FincScaleNode}.
   * Deploys the current node and returns a promise to the parent node.
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {Promise<String,Error>} child a Promise containing result of processing
   *   the only child (its subtree) of the current node
   * @return {Promise.<String,Error>} promise that resolves to the id of the deployed
   * Fincontract primitive or rejects with an error
   */
  async processScaleNode(node, child) {
    const args = [node.scale, await child];
    return this.deployPrimitive('Scale', args);
  }

  /**
   * Called during preorder traversal when processing {@link FincOneNode}.
   * Deploys the current node and returns a promise to the parent node.
   * @override
   * @param  {FincNode} node currently processed node
   * @return {Promise.<String,Error>} promise that resolves to the id of the deployed
   * Fincontract primitive or rejects with an error
   */
  async processOneNode(node) {
    return this.deployPrimitive('One', [node.currency]);
  }

  /**
   * Called during preorder traversal when processing {@link FincZeroNode}.
   * Deploys the current node and returns a promise to the parent node.
   * @override
   * @return {Promise.<String,Error>} promise that resolves to the id of the deployed
   * Fincontract primitive or rejects with an error
   */
  async processZeroNode() {
    return this.deployPrimitive('Zero', []);
  }

  /**
   * Called during preorder traversal when processing an unknown node
   * @override
   * @throws {Error} always
   */
  processUnknownNode() {
    throw new Error('Unknown case during description deployment!');
  }
}
exports.default = DescriptionDeployer;