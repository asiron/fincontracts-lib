'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _txSender = require('./tx-sender');

var _txSender2 = _interopRequireDefault(_txSender);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var log = require('minilog')('example');
require('minilog').enable();

/**
 * Examples class is meant to deploy some of the tests defined in
 * {@link FincontractMarketplace} as well as assign Gateways to global values.
 * It's solely for testing purposes and should be removed once the project is
 * released.
 */

var Examples = function () {
  _createClass(Examples, null, [{
    key: 'AllExamples',


    /** @private */
    get: function get() {
      return ['simpleTest', 'complexScaleObsTest', 'timeboundTest', 'setGateways', 'resetGateways'];
    }

    /**
     * Constucts the {@link Examples} object that allows for deployment
     * of predefined tests
     * @param {FincontractMarketplace} marketplace a Fincontracts smart contract instance
     * @param {Gateway} gatewaybool a connected GatewayBool instance
     * @param {Gateway} gatewayint a connected GatewayInteger instance
     * @param {Web3} web3 a web3 instance connected to Ethereum node
     */

  }]);

  function Examples(marketplace, gatewaybool, gatewayint, web3) {
    _classCallCheck(this, Examples);

    /** @private */
    this.marketplace = marketplace;
    /** @private */
    this.gatewaybool = gatewaybool;
    /** @private */
    this.gatewayint = gatewayint;
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


  _createClass(Examples, [{
    key: 'runExample',
    value: function runExample(name) {
      var noArgExamples = ['simpleTest', 'complexScaleObsTest'];
      if (noArgExamples.includes(name)) {
        return this.deployExample(name, [0x0]);
      } else if (name === 'timeboundTest') {
        var lowerBound = Math.round(Date.now() / 1000 + 120);
        var upperBound = Math.round(Date.now() / 1000 + 3600);
        return this.deployExample('timeboundTest', [0x0, lowerBound, upperBound]);
      } else if (['setGateways', 'resetGateways'].includes(name)) {
        var gwint = name === 'setGateways' ? this.gatewayint.address : 0;

        var gwbool = name === 'setGateways' ? this.gatewaybool.address : 0;

        return this.setGateways(gwint, gwbool);
      }
      return Promise.reject(Error('Example does not exist!'));
    }

    /**
     * Runs setGatewayI and setGatewayB {@link FincontractMarketplace} functions
     * with specified parameters as addresses to these gateways.
     * @param {String} gwint address of GatewayI
     * @param {String} gwbool address of GatewayB
     * @return {Promise<String, Error>} promise that resolve to nothing or rejects
     *   with an Error in case transaction has failed
     */

  }, {
    key: 'setGateways',
    value: function setGateways(gwint, gwbool) {
      var p1 = this.deploy('setGatewayI', [gwint], { block: 'latest' }, function () {
        return log.info('gatewayI set to ' + gwint);
      });
      var p2 = this.deploy('setGatewayB', [gwbool], { block: 'latest' }, function () {
        return log.info('gatewayB set to ' + gwbool);
      });
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

  }, {
    key: 'deployExample',
    value: function deployExample(name, args) {
      return this.deploy(name, args, { event: 'CreatedBy' }, function (logs) {
        var fctID = logs.args.fctId;
        var owner = logs.args.user;
        log.info('Fincontract: ' + fctID);
        log.info('Created for: ' + owner);
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

  }, {
    key: 'deploy',
    value: function deploy(name, args, filter, callback) {
      var s = new _txSender2.default(this.marketplace, this.web3);
      return s.send(name, args).watch(filter, callback);
    }
  }]);

  return Examples;
}();

exports.default = Examples;