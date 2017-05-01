'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fincontractDescriptionDeployer = require('./fincontract-description-deployer');

var _fincontractDescriptionDeployer2 = _interopRequireDefault(_fincontractDescriptionDeployer);

var _txSender = require('./tx-sender');

var _txSender2 = _interopRequireDefault(_txSender);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var log = require('minilog')('deploy');
require('minilog').enable();

/** @external {Web3} https://github.com/ethereum/wiki/wiki/JavaScript-API */
/** @external {FincontractMarketplace} https://bitbucket.org/s-tikhomirov/fincontracts.git */
/** @external {Gateway} https://bitbucket.org/s-tikhomirov/fincontracts.git */

/**
 * Deployer allows for deployment of {@link Fincontract} to the blockchain in
 * a series of transaction. It makes sure that the topological
 * order of {@link FincNode}s is preserved. It also allows for immediate issuance
 * of the {@link Fincontract} to a given proposed owner.
 * @example
 * import Deployer from './fincontract-deployer';
 * try {
 *   const d = new Deployer(marketplace, web3);
 *   const id = await d.deploy(fincontract);
 * catch (err) {
 *   console.log(err);
 * }
 */

var Deployer = function () {

  /**
   * Constructs the {@link Deployer} object with Fincontracts smart contract instance and
   * web3 instance connected to an Ethereum node
   * @param {FincontractMarketplace} marketplace a Fincontracts smart contract instance
   * @param {Web3} web3 a web3 instance connected to an Ethereum node
   */
  function Deployer(marketplace, web3) {
    _classCallCheck(this, Deployer);

    /** @private */
    this.dd = new _fincontractDescriptionDeployer2.default(marketplace, web3);
    /** @private */
    this.sender = new _txSender2.default(marketplace, web3);
    /** @private */
    this.marketplace = marketplace;
  }

  /**
   * Deploys a description of a Fincontract to the blockchain by traversing
   * the Fincontract description (See {@link FincNode} and {@link DescriptionDeployer})
   * and returns a promise that resolves to id of the deployed Fincontract.
   * @param  {FincNode} description Root description of {@link Fincontract}
   * @return {Promise.<String, Error>} promise that resolves
   *  to id of blockchain deployed Fincontract or rejects with an error
   */


  _createClass(Deployer, [{
    key: 'deploy',
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(description) {
        var descID;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.dd.deployDescription(description);

              case 2:
                descID = _context.sent;
                return _context.abrupt('return', this.deployFincontract(descID));

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function deploy(_x) {
        return _ref.apply(this, arguments);
      }

      return deploy;
    }()

    /**
     * Deploys a description of a Fincontract to the blockchain
     * (See {@link Deployer#deploy}) and then issues it for the proposed owner.
     * @param  {FincNode} description Root description of {@link Fincontract}
     * @param  {String} proposedOwner address of the proposed owner's Ethereum account
     * @return {Promise.<String, Error>} promise that resolves
     *  to id of blockchain deployed Fincontractor rejects with an error
     */

  }, {
    key: 'issue',
    value: function () {
      var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(description, proposedOwner) {
        var fctID;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.deploy(description);

              case 2:
                fctID = _context2.sent;
                return _context2.abrupt('return', this.issueFincontract(fctID, proposedOwner));

              case 4:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function issue(_x2, _x3) {
        return _ref2.apply(this, arguments);
      }

      return issue;
    }()

    /**
     * Deploys the actual Fincontract to the blockchain given that the description
     * was already deployed and it's id is given as the argument
     * @param  {String} descID Fincontract description's id deployed to the blockchain
     * @return {Promise.<String, Error>} Promise that resolves
     *  to Fincontract's id deployed
     *  to the blockchain or rejects with an error
     */

  }, {
    key: 'deployFincontract',
    value: function deployFincontract(descID) {
      return this.sender.send('createFincontract', [descID]).watch({ event: 'CreatedBy' }, function (logs) {
        var fctID = logs.args.fctId;
        var owner = logs.args.user;
        log.info('Fincontract: ' + fctID);
        log.info('Created for: ' + owner);
        return fctID;
      });
    }

    /**
     * Issues the actual Fincontract to the proposed owner in the blockchain
     * given that the Fincontract was already deployed and
     * it's id is given as the argument
     * @param  {String} fctID Fincontract's id deployed to the blockchain
     * @param  {String} proposedOwner address of the proposed owner's Ethereum account
     * @return {Promise.<String, Error>} Promise that resolves
     *  to Fincontract's id deployed to the blockchain or rejects with an error
     */

  }, {
    key: 'issueFincontract',
    value: function issueFincontract(fctID, proposedOwner) {
      return this.sender.send('issueFor', [fctID, proposedOwner]).watch({ event: 'IssuedFor' }, function (logs) {
        var fctID = logs.args.fctId;
        var proposedOwner = logs.args.proposedOwner;
        log.info('Fincontract: ' + fctID);
        log.info('Issued for: ' + proposedOwner);
        return fctID;
      });
    }
  }]);

  return Deployer;
}();

exports.default = Deployer;