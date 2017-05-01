'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OrNodeChecker = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fincontractGatewayUpdater = require('./fincontract-gateway-updater');

var _fincontractGatewayUpdater2 = _interopRequireDefault(_fincontractGatewayUpdater);

var _fincontractFetcher = require('./fincontract-fetcher');

var _fincontractFetcher2 = _interopRequireDefault(_fincontractFetcher);

var _txSender = require('./tx-sender');

var _txSender2 = _interopRequireDefault(_txSender);

var _fincontractVisitor = require('./fincontract-visitor');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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
var OrNodeChecker = exports.OrNodeChecker = function (_EmptyVisitor) {
  _inherits(OrNodeChecker, _EmptyVisitor);

  function OrNodeChecker() {
    _classCallCheck(this, OrNodeChecker);

    return _possibleConstructorReturn(this, (OrNodeChecker.__proto__ || Object.getPrototypeOf(OrNodeChecker)).apply(this, arguments));
  }

  _createClass(OrNodeChecker, [{
    key: 'processOrNode',


    /**
     * Called when processing {@link FincOrNode}. Returns true, because we have
     * reached an OR node.
     * @override
     * @return {true}
     */
    value: function processOrNode() {
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

  }, {
    key: 'processTimeboundNode',
    value: function processTimeboundNode(node, child) {
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

  }, {
    key: 'processScaleNode',
    value: function processScaleNode(node, child) {
      return child;
    }
  }]);

  return OrNodeChecker;
}(_fincontractVisitor.EmptyVisitor);

var isOrNode = function isOrNode(root) {
  return new OrNodeChecker().visit(root);
};

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

var Executor = function () {
  _createClass(Executor, null, [{
    key: 'Timeout',


    /**
     * Time in seconds to trigger timeout error if nothing has happened. By default
     * it's 90 seconds.
     * @type {Number}
     */
    get: function get() {
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

  }]);

  function Executor(marketplace, gateway, web3) {
    _classCallCheck(this, Executor);

    /** @private */
    this.web3 = web3;
    /** @private */
    this.marketplace = marketplace;
    /** @private */
    this.gateway = gateway;
    /** @private */
    this.fetcher = new _fincontractFetcher2.default(marketplace);
    /** @private */
    this.sender = new _txSender2.default(marketplace, web3);
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


  _createClass(Executor, [{
    key: 'join',
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(fctID) {
        var f, account, newOwner, issued, sent;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.pullThenUpdateGateways(fctID);

              case 2:
                f = _context.sent;
                account = this.web3.eth.defaultAccount;
                newOwner = f.proposedOwner;
                issued = newOwner === account || parseInt(newOwner, 16) === 0;

                if (issued) {
                  _context.next = 8;
                  break;
                }

                throw new Error('Cannot own this fincontract');

              case 8:
                sent = this.sender.send('join', [f.id]);
                return _context.abrupt('return', this.watchExecution(sent));

              case 10:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function join(_x) {
        return _ref.apply(this, arguments);
      }

      return join;
    }()

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

  }, {
    key: 'choose',
    value: function () {
      var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(fctID, choice) {
        var f, account, isOwner, sent;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.pullThenUpdateGateways(fctID);

              case 2:
                f = _context2.sent;

                if (isOrNode(f.rootDescription)) {
                  _context2.next = 5;
                  break;
                }

                throw new Error('Root node of fincontract is not an OR node!');

              case 5:
                account = this.web3.eth.defaultAccount;
                isOwner = account === f.owner;

                if (isOwner) {
                  _context2.next = 9;
                  break;
                }

                throw new Error('Only owner can choose a sub-fincontract!');

              case 9:
                sent = this.sender.send('executeOr', [f.id, choice]);
                return _context2.abrupt('return', this.watchExecution(sent));

              case 11:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function choose(_x2, _x3) {
        return _ref2.apply(this, arguments);
      }

      return choose;
    }()

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

  }, {
    key: 'watchExecution',
    value: function () {
      var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(sentTransaction) {
        var _this2 = this;

        var executed, deferred, timeout;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                executed = sentTransaction.watch({ event: 'Executed' }, function (logs) {
                  return { type: 'executed', deleted: logs.args.fctId };
                });
                deferred = sentTransaction.watch({ event: 'Deleted' }, function (logs) {
                  return _this2.processDeferredExecution(logs.args.fctId);
                });
                _context3.next = 4;
                return sentTransaction.promise;

              case 4:
                timeout = new Promise(function (resolve, reject) {
                  setTimeout(reject, Executor.Timeout, Error('Execution timed out! Probably threw!'));
                });
                return _context3.abrupt('return', Promise.race([executed, deferred, timeout]));

              case 6:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function watchExecution(_x4) {
        return _ref3.apply(this, arguments);
      }

      return watchExecution;
    }()

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

  }, {
    key: 'processDeferredExecution',
    value: function processDeferredExecution(deleted) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        _this3.marketplace.CreatedBy().get(function (err, events) {
          if (err) {
            reject(Error(err + ' when getting new Fincontract ids'));
            return;
          }
          var newFincontracts = events.reduce(function (x, _ref4) {
            var fctId = _ref4.args.fctId;

            return [].concat(_toConsumableArray(x), [fctId]);
          }, []);
          resolve({ type: 'deferred', deleted: deleted, newFincontracts: newFincontracts });
        });
      });
    }

    /**
     * Pulls a Fincontract from the blockchain given its 32-byte address, then
     * updates all its Gateways, if there are any.
     * @param  {String} fctID - 32-byte address of a deployed Fincontract
     * @return {Fincontract} pulled Fincontract from the blockchain
     */

  }, {
    key: 'pullThenUpdateGateways',
    value: function () {
      var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(fctID) {
        var f, gu;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this.fetcher.pullFincontract(fctID);

              case 2:
                f = _context4.sent;
                gu = new _fincontractGatewayUpdater2.default(this.web3, this.gateway);
                _context4.next = 6;
                return gu.updateAllGateways(f.rootDescription);

              case 6:
                return _context4.abrupt('return', f);

              case 7:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function pullThenUpdateGateways(_x5) {
        return _ref5.apply(this, arguments);
      }

      return pullThenUpdateGateways;
    }()
  }]);

  return Executor;
}();

exports.default = Executor;