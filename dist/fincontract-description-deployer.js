'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _txSender = require('./tx-sender');

var _txSender2 = _interopRequireDefault(_txSender);

var _fincontractVisitor = require('./fincontract-visitor');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var log = require('minilog')('desc-deploy');
require('minilog').enable();

/**
 * Deploys a Fincontract description to the blockchain by traversing
 * the {@link FincNode} tree in preorder fashion to ensure topological ordering.
 * Extends {@link Visitor} which implements preorder tree traversal.
 * @extends {Visitor}
 */

var DescriptionDeployer = function (_Visitor) {
  _inherits(DescriptionDeployer, _Visitor);

  /**
   * Constructs the {@link DescriptionDeployer} object with
   * Fincontracts smart contract instance and web3 instance
   * connected to an Ethereum node
   * @param {FincontractMarketplace} marketplace a Fincontracts smart contract instance
   * @param {Web3} web3 a web3 instance connected to Ethereum node
   */
  function DescriptionDeployer(marketplace, web3) {
    _classCallCheck(this, DescriptionDeployer);

    /** @private */
    var _this = _possibleConstructorReturn(this, (DescriptionDeployer.__proto__ || Object.getPrototypeOf(DescriptionDeployer)).call(this));

    _this.marketplace = marketplace;
    /** @private */
    _this.sender = new _txSender2.default(marketplace, web3);
    return _this;
  }

  /**
   * Deploys {@link Fincontract} description (a tree with root located
   * at {@link Fincontract.rootDescription}) to the blockchain using a series
   * of Ethereum transactions and returns a promise which resolves to
   * a description id or it is rejected with an error.
   * @param  {FincNode} root root of the {@link FincNode} tree to be deployed
   * @return {Promise.<String,Error>} promise that resolves to top-level Fincontract's description id
   */


  _createClass(DescriptionDeployer, [{
    key: 'deployDescription',
    value: function deployDescription(root) {
      return this.visit(root);
    }

    /**
     * Deploys a single Fincontract primitive to the blockchain
     * @param  {String} name name of the primitive
     * @param  {Array} args arguments fed into primitive's deployment transaction
     * @return {Promise.<String,Error>} promise that resolves to Fincontract primitive's id
     *  deployed to the blockchain or rejects with an error
     */

  }, {
    key: 'deployPrimitive',
    value: function deployPrimitive(name, args) {
      return this.sender.send(name, args).watch({ event: 'PrimitiveStoredAt' }, function (logs) {
        var primitiveId = logs.args.id;
        log.info(name + ' primitive ID: ' + primitiveId);
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

  }, {
    key: 'processAndNode',
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(node, left, right) {
        var children;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return Promise.all([left, right]);

              case 2:
                children = _context.sent;
                return _context.abrupt('return', this.deployPrimitive('And', children));

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function processAndNode(_x, _x2, _x3) {
        return _ref.apply(this, arguments);
      }

      return processAndNode;
    }()

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

  }, {
    key: 'processIfNode',
    value: function () {
      var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(node, left, right) {
        var children, args;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return Promise.all([left, right]);

              case 2:
                children = _context2.sent;
                args = [node.gatewayAddress].concat(_toConsumableArray(children));
                return _context2.abrupt('return', this.deployPrimitive('If', args));

              case 5:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function processIfNode(_x4, _x5, _x6) {
        return _ref2.apply(this, arguments);
      }

      return processIfNode;
    }()

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

  }, {
    key: 'processOrNode',
    value: function () {
      var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(node, left, right) {
        var children;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return Promise.all([left, right]);

              case 2:
                children = _context3.sent;
                return _context3.abrupt('return', this.deployPrimitive('Or', children));

              case 4:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function processOrNode(_x7, _x8, _x9) {
        return _ref3.apply(this, arguments);
      }

      return processOrNode;
    }()

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

  }, {
    key: 'processTimeboundNode',
    value: function () {
      var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(node, child) {
        var args;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.t0 = node.lowerBound;
                _context4.t1 = node.upperBound;
                _context4.next = 4;
                return child;

              case 4:
                _context4.t2 = _context4.sent;
                args = [_context4.t0, _context4.t1, _context4.t2];
                return _context4.abrupt('return', this.deployPrimitive('Timebound', args));

              case 7:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function processTimeboundNode(_x10, _x11) {
        return _ref4.apply(this, arguments);
      }

      return processTimeboundNode;
    }()

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

  }, {
    key: 'processGiveNode',
    value: function () {
      var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(node, child) {
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.t0 = this;
                _context5.next = 3;
                return child;

              case 3:
                _context5.t1 = _context5.sent;
                _context5.t2 = [_context5.t1];
                return _context5.abrupt('return', _context5.t0.deployPrimitive.call(_context5.t0, 'Give', _context5.t2));

              case 6:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function processGiveNode(_x12, _x13) {
        return _ref5.apply(this, arguments);
      }

      return processGiveNode;
    }()

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

  }, {
    key: 'processScaleObsNode',
    value: function () {
      var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(node, child) {
        var args;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.t0 = node.gatewayAddress;
                _context6.next = 3;
                return child;

              case 3:
                _context6.t1 = _context6.sent;
                args = [_context6.t0, _context6.t1];
                return _context6.abrupt('return', this.deployPrimitive('ScaleObs', args));

              case 6:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function processScaleObsNode(_x14, _x15) {
        return _ref6.apply(this, arguments);
      }

      return processScaleObsNode;
    }()

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

  }, {
    key: 'processScaleNode',
    value: function () {
      var _ref7 = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(node, child) {
        var args;
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _context7.t0 = node.scale;
                _context7.next = 3;
                return child;

              case 3:
                _context7.t1 = _context7.sent;
                args = [_context7.t0, _context7.t1];
                return _context7.abrupt('return', this.deployPrimitive('Scale', args));

              case 6:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function processScaleNode(_x16, _x17) {
        return _ref7.apply(this, arguments);
      }

      return processScaleNode;
    }()

    /**
     * Called during preorder traversal when processing {@link FincOneNode}.
     * Deploys the current node and returns a promise to the parent node.
     * @override
     * @param  {FincNode} node currently processed node
     * @return {Promise.<String,Error>} promise that resolves to the id of the deployed
     * Fincontract primitive or rejects with an error
     */

  }, {
    key: 'processOneNode',
    value: function () {
      var _ref8 = _asyncToGenerator(regeneratorRuntime.mark(function _callee8(node) {
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                return _context8.abrupt('return', this.deployPrimitive('One', [node.currency]));

              case 1:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function processOneNode(_x18) {
        return _ref8.apply(this, arguments);
      }

      return processOneNode;
    }()

    /**
     * Called during preorder traversal when processing {@link FincZeroNode}.
     * Deploys the current node and returns a promise to the parent node.
     * @override
     * @return {Promise.<String,Error>} promise that resolves to the id of the deployed
     * Fincontract primitive or rejects with an error
     */

  }, {
    key: 'processZeroNode',
    value: function () {
      var _ref9 = _asyncToGenerator(regeneratorRuntime.mark(function _callee9() {
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                return _context9.abrupt('return', this.deployPrimitive('Zero', []));

              case 1:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function processZeroNode() {
        return _ref9.apply(this, arguments);
      }

      return processZeroNode;
    }()

    /**
     * Called during preorder traversal when processing an unknown node
     * @override
     * @throws {Error} always
     */

  }, {
    key: 'processUnknownNode',
    value: function processUnknownNode() {
      throw new Error('Unknown case during description deployment!');
    }
  }]);

  return DescriptionDeployer;
}(_fincontractVisitor.Visitor);

exports.default = DescriptionDeployer;