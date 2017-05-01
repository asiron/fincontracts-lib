'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var log = require('minilog')('sender');
require('minilog').enable();

var wasTransactionIncluded = function wasTransactionIncluded(web3, blockHash, tx) {
  return web3.eth.getBlock(blockHash).transactions.includes(tx);
};

/**
 * Object passed to {@link Transaction#watch} as filter argument that specifies
 * type of event or blockchain change to watch for.
 * @typedef {Object} TransactionFilter
 * @property {String} event - {@link FincontractMarketplace}'s event to
 *   watch for
 * @property {String} block - Blockchain change to watch for (see {@link Web3},
 *   specifically `web3.eth.filter` for more details)
 */

/** A sent transaction, which can be watched for events. */

var Transaction = exports.Transaction = function () {

  /**
   * Constructs {@link Transaction} object with a promise of sent transaction
   * as first argument and the usual context necessary for
   * interacting with blockchain
   * @param  {Promise<String,Error>} sent promise of sent transaction, should be
   *   the return value of {@link Sender#send}
   * @param {FincontractMarketplace} marketplace a Fincontracts smart contract instance
   * @param {Web3} web3 a web3 instance connected to Ethereum node
   */
  function Transaction(sent, contract, web3) {
    _classCallCheck(this, Transaction);

    /** @type {Promise<String,Error>} */
    this.sent = sent;
    /** @private */
    this.contract = contract;
    /** @private */
    this.web3 = web3;
  }

  /**
   * Constructs a listener and starts watching for the event to happen.
   * Once the event happens the callback will be executed and the returned
   * promise gets resolved with the callback's return value. If any error
   * happens during the execution, the promise rejects with that error.
   * @param {TransactionFilter} filter a filter object to listen for events
   * @param {Function} callback a callback to be executed once event was
   *   triggered
   * @return {Promise<String,Error>} promise that resolves to the value returned
   *  by the callback
   */


  _createClass(Transaction, [{
    key: 'watch',
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(filter, callback) {
        var _this = this;

        var listener, predicate, options, makeListener, tx;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                makeListener = function makeListener(tx) {
                  return new Promise(function (resolve, reject) {
                    listener.watch(function (err, logs) {
                      if (err) {
                        reject(Error(err + ' when watching tx: ' + tx));
                        return;
                      }
                      if (predicate(tx, logs)) {
                        listener.stopWatching();
                        var yielded = callback(logs);
                        resolve(yielded);
                      }
                    });
                  });
                };

                listener = null;
                predicate = null;

                if (!filter.event) {
                  _context.next = 9;
                  break;
                }

                options = { fromBlock: 'latest', toBlock: 'pending' };

                listener = this.contract[filter.event].call(options);
                predicate = function predicate(tx, logs) {
                  return logs.transactionHash === tx;
                };
                _context.next = 16;
                break;

              case 9:
                if (!filter.block) {
                  _context.next = 14;
                  break;
                }

                listener = this.web3.eth.filter(filter.block);
                predicate = function predicate(tx, logs) {
                  return wasTransactionIncluded(_this.web3, logs, tx);
                };
                _context.next = 16;
                break;

              case 14:
                this.sent = Promise.reject(Error('Wrong filter, was: ' + filter));
                return _context.abrupt('return', this);

              case 16:
                _context.next = 18;
                return this.sent;

              case 18:
                tx = _context.sent;
                return _context.abrupt('return', makeListener(tx));

              case 20:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function watch(_x, _x2) {
        return _ref.apply(this, arguments);
      }

      return watch;
    }()
  }]);

  return Transaction;
}();

/**
 * Sender class allows for sending Ethereum transactions and returns
 * {@link Transaction} objects that can be then watched for events
 * (see {@link Transaction#watch}).
 */


var Sender = function () {
  _createClass(Sender, null, [{
    key: 'GasLimit',


    /**
     * Maximum Gas to be spent in an Ethereum transaction
     * @type {Number}
     */
    get: function get() {
      return 4000000;
    }

    /**
     * Constructs {@link Sender} object with the usual context for interacting with
     * the FincontractMarketplace smart contract instance.
     * @param {FincontractMarketplace} marketplace a Fincontracts smart contract instance
     * @param {Web3} web3 a web3 instance connected to Ethereum node
     */

  }]);

  function Sender(contract, web3) {
    _classCallCheck(this, Sender);

    /** @private */
    this.contract = contract;
    /** @private */
    this.web3 = web3;
  }

  /**
   * Sends a transaction to the blockchain using the smart contract instance
   * set within constructor. Name argument is used to retrieve correct function
   * and the arguments are then fed as the arguments of the transaction.
   * Transaction sometimes is lost for unknown reasons. In this case, it will be
   * resent until it's on the list of pending transactions.
   * @param  {String} name a name of the transaction to be sent
   * @param  {Array} args arguments to be fed to that transaction
   * @return {Transaction} transaction object with {@link Transaction.sent} set
   *   to the promise of the sent transaction
   */


  _createClass(Sender, [{
    key: 'send',
    value: function send(name, args) {
      var _this2 = this;

      var executor = function executor(resolve, reject) {
        var method = _this2.contract[name];
        method.sendTransaction.apply(method, _toConsumableArray(args).concat([{ gas: Sender.GasLimit }, function (err, tx) {
          if (err) {
            reject(err + ' at transaction \'' + name + '\' with args: ' + args);
            return;
          }
          log.info(name + ' transaction was sent. HASH: ' + tx);
          if (!_this2.web3.eth.getTransaction(tx)) {
            log.warn('Transaction was lost! HASH: ' + tx);
            return executor(resolve, reject);
          }
          resolve(tx);
        }]));
      };
      var sent = new Promise(function (resolve, reject) {
        return executor(resolve, reject);
      });
      return new Transaction(sent, this.contract, this.web3);
    }
  }]);

  return Sender;
}();

exports.default = Sender;