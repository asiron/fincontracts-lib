'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GatewayVisitor = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fincontractVisitor = require('./fincontract-visitor');

var _txSender = require('./tx-sender');

var _txSender2 = _interopRequireDefault(_txSender);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var log = require('minilog')('gateway-updater');
require('minilog').enable();

/**
 * {@link GatewayVisitor} performs the actual Gateway update by traversing
 * the {@link FincNode} description tree. It extends {@link CollectingVisitor},
 * in order to receive a list of Promises that resolve when Gateways are updated.
 * @extends {CollectingVisitor}
 */

var GatewayVisitor = exports.GatewayVisitor = function (_CollectingVisitor) {
  _inherits(GatewayVisitor, _CollectingVisitor);

  /**
   * Constructs the {@link GatewayVisitor} object with a web3 instance
   * connected to an Ethereum node and a Gateway smart contract instance not
   * connected to any address
   * @param {Web3} web3 a web3 instance connected to an Ethereum node
   * @param {Gateway} gateway a gateway instance not connected to any address
   */
  function GatewayVisitor(web3, gateway) {
    _classCallCheck(this, GatewayVisitor);

    /** @private */
    var _this = _possibleConstructorReturn(this, (GatewayVisitor.__proto__ || Object.getPrototypeOf(GatewayVisitor)).call(this));

    _this.web3 = web3;
    /** @private */
    _this.gateway = gateway;
    return _this;
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


  _createClass(GatewayVisitor, [{
    key: 'updateGateway',
    value: function updateGateway(address, type) {
      if (!parseInt(address, 16)) {
        throw new Error('Gateway\'s address was 0x0');
      }
      var gw = this.gateway.at(address);
      return new _txSender2.default(gw, this.web3).send('update', []).watch({ block: 'latest' }, function () {
        log.info('Finished updating ' + type + ' gateway at: ' + address);
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

  }, {
    key: 'processIfNode',
    value: function processIfNode(node, left, right) {
      var self = this.updateGateway(node.gatewayAddress, 'If');
      return [].concat(_toConsumableArray(left), _toConsumableArray(right), [self]);
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

  }, {
    key: 'processScaleObsNode',
    value: function processScaleObsNode(node, child) {
      var self = this.updateGateway(node.gatewayAddress, 'ScaleObs');
      return [].concat(_toConsumableArray(child), [self]);
    }
  }]);

  return GatewayVisitor;
}(_fincontractVisitor.CollectingVisitor);

/**
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


var GatewayUpdater = function () {

  /**
   * Constructs the {@link GatewayUpdater} object with a web3 instance
   * connected to an Ethereum node and a Gateway smart contract instance not
   * connected to any address
   * @param {Web3} web3 a web3 instance connected to an Ethereum node
   * @param {Gateway} gateway a gateway instance not connected to any address
   */
  function GatewayUpdater(web3, gateway) {
    _classCallCheck(this, GatewayUpdater);

    /** @private */
    this.gv = new GatewayVisitor(web3, gateway);
  }

  /**
   * @param  {FincNode} node - {@link FincNode} description tree
   * @return {Promise<null,Error>} promise that resolves to nothing if all
   *   Gateways were correctly updated or rejects with an Error
   */


  _createClass(GatewayUpdater, [{
    key: 'updateAllGateways',
    value: function updateAllGateways(node) {
      return Promise.all(this.gv.visit(node));
    }
  }]);

  return GatewayUpdater;
}();

exports.default = GatewayUpdater;