'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EvaluatorVisitor = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.makeEstimationEvaluators = makeEstimationEvaluators;
exports.makeDirectEvaluators = makeDirectEvaluators;

var _fincontractVisitor = require('./fincontract-visitor');

var _currency = require('./currency');

var _currency2 = _interopRequireDefault(_currency);

var _fincontractGatewayUpdater = require('./fincontract-gateway-updater');

var _fincontractGatewayUpdater2 = _interopRequireDefault(_fincontractGatewayUpdater);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var makeArray = function makeArray(size, obj) {
  return Array.apply(null, Array(size)).map(function () {
    return obj;
  });
};
var flatten = function flatten(arr) {
  return arr.reduce(function (a, b) {
    return a.concat(b);
  });
};
var cross = function cross(arr1, arr2) {
  return arr1.map(function (a) {
    return arr2.map(function (b) {
      return [a, b];
    });
  });
};
var zip = function zip(a1, a2) {
  return a1.map(function (x, i) {
    return [x, a2[i]];
  });
};
var tupleMUL = function tupleMUL(i) {
  return i[0] * i[1];
};

/**
 * NodeEvaluators is an Object that contains evaluator functions for all
 * types of nodes (See classes that inherit from {@link FincNode}). Each key
 * contains a function that has to return the actual evaluator function. This is
 * because certain evaluations require node's context and certain do not.
 * The actual evaluator function has to take one argument, that is
 * one interval or a tuple of two intervals. It has to always return a single
 * interval.
 *
 * @typedef {Object} NodeEvaluators
 * @property {Callback} if - Evaluates {@link FincIfNode} nodes
 * @property {Callback} or - Evaluates {@link FincOrNode} nodes
 * @property {Callback} and - Evaluates {@link FincIfNode} nodes
 * @property {Callback} give - Evaluates {@link FincGiveNode} nodes
 * @property {Callback} scale - Evaluates {@link FincScaleNode} nodes
 * @property {Callback} scaleObs - Evaluates {@link FincScaleObsNode} nodes
 * @property {Callback} timebound - Evaluates {@link FincIfNode} nodes
 * @property {Callback} zero - Evaluates {@link FincZeroNode} nodes
 * @property {Callback} one - Evaluates {@link FincOneNode} nodes
 */

/**
 * Returns {@link NodeEvaluators} object for evaluating using `estimate` method.
 * Nodes are defined as:
 * <ul>
 *  <li>`if`  : interval arithmetic union</li>
 *  <li>`or`  : interval arithmetic union</li>
 *  <li>`an`d : interval arithmetic addition</li>
 *  <li>`give`  : interval arithmetic negation</li>
 *  <li>`scale`  : interval arithmetic scalar mulitplication with scale</li>
 *  <li>`scaleObs`  : interval arithmetic multiplication with estimate scale interval</li>
 *  <li>`timebound`  : zero interval if fincontract's upper bound has passed</li>
 *  <li>`one`  : interval arithmetic 1</li>
 *  <li>`zero`  : interval arithmetic 0</li>
 * </ul>
 * @return {NodeEvaluators} node evaluators object describing `estimate`
 * evaluation method
 */
function makeEstimationEvaluators() {
  return {
    if: function _if() {
      return function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            iA = _ref2[0],
            iB = _ref2[1];

        return [Math.min(iA[0], iB[0]), Math.max(iA[1], iB[1])];
      };
    },
    or: function or() {
      return function (_ref3) {
        var _ref4 = _slicedToArray(_ref3, 2),
            iA = _ref4[0],
            iB = _ref4[1];

        return [Math.min(iA[0], iB[0]), Math.max(iA[1], iB[1])];
      };
    },
    and: function and() {
      return function (_ref5) {
        var _ref6 = _slicedToArray(_ref5, 2),
            iA = _ref6[0],
            iB = _ref6[1];

        return [iA[0] + iB[0], iA[1] + iB[1]];
      };
    },
    give: function give() {
      return function (i) {
        return [-i[1], -i[0]];
      };
    },
    scale: function scale(node) {
      return function (i) {
        return [i[0] * node.scale, i[1] * node.scale];
      };
    },
    scaleObs: function scaleObs(node) {
      return function (i) {
        // Throw in the futures if range is not defined!
        var range = node.range || [1, 1.2];
        var a = flatten(cross(range, i)).map(tupleMUL);
        return [Math.min.apply(Math, _toConsumableArray(a)), Math.max.apply(Math, _toConsumableArray(a))];
      };
    },
    timebound: function timebound(node) {
      return function (i) {
        return node.upperBound < Math.round(Date.now() / 1000) ? [0, 0] : i;
      };
    },
    zero: function zero() {
      return function () {
        return makeArray(_currency2.default.CurrencyCount, [0, 0]);
      };
    },
    one: function one(node) {
      return function () {
        var arr = makeArray(_currency2.default.CurrencyCount, [0, 0]);
        arr[node.currency] = [1, 1];
        return arr;
      };
    }
  };
}

/**
 * Returns {@link NodeEvaluators} object for evaluating using `direct`
 * (See {@link makeEstimationEvaluators}) method.
 * Nodes are defined exactly as for `estimate` method with exceptions of:
 * <ul>
 *  <li>`if` : selects the child interval based on the boolean
 *    value obtained from calling the gateway</li>
 *  <li>`scaleObs`  : interval arithmetic scalar multiplication
 *    with scale obtained from calling the gateway</li>
 * </ul>
 * @param {Web3} web3 a web3 instance connected to Ethereum node
 * @param {Gateway} gateway a gateway instance not connected to any address
 * @return {NodeEvaluators} node evaluators object describing `direct`
 * evaluation method
 */
function makeDirectEvaluators(web3, gateway) {
  var evaluator = makeEstimationEvaluators();
  evaluator.if = function (node) {
    return function (_ref7) {
      var _ref8 = _slicedToArray(_ref7, 2),
          iA = _ref8[0],
          iB = _ref8[1];

      var bool = gateway.at(node.gatewayAddress).getValue.call();
      return bool ? iA : iB;
    };
  };
  evaluator.scaleObs = function (node) {
    return function (i) {
      var scale = gateway.at(node.gatewayAddress).getValue.call();
      return [i[0] * scale, i[1] * scale];
    };
  };
  return evaluator;
}

/**
 * Performs the actual evaluation of a {@link Fincontract} by analysing its
 * description tree (See {@link FincNode}). Traverses the tree in preorder
 * fashion and applies node evaluator functions at each node, returning the
 * result to the parent node. The choice of node evaluator functions defines
 * the evaluation method.
 * @extends {Visitor}
 */

var EvaluatorVisitor = exports.EvaluatorVisitor = function (_Visitor) {
  _inherits(EvaluatorVisitor, _Visitor);

  /**
   * Constructs the {@link EvaluatorVisitor} object with evaluator functions
   * @extends {Visitor}
   * @param {NodeEvaluators} nodeEvaluators an object with evaluator functions
   */
  function EvaluatorVisitor(nodeEvaluators) {
    _classCallCheck(this, EvaluatorVisitor);

    /** @type {NodeEvaluator} */
    var _this = _possibleConstructorReturn(this, (EvaluatorVisitor.__proto__ || Object.getPrototypeOf(EvaluatorVisitor)).call(this));

    _this.nodeEvaluators = nodeEvaluators;
    return _this;
  }

  /**
   * Called during preorder traversal when processing {@link FincAndNode}.
   * Evaluates the current node using `NodeEvaluators.and`
   * (See {@link NodeEvaluators}) evaluator function by mapping over all currencies.
   * @override
   * @param  {FincNode} node node currently being processed
   * @param  {Array} left an array of intervals resulted from processing
   *   left child (first subtree) of the current node
   * @param  {Array} right an array of intervals resulted from processing
   *   right child (second subtree) of the current node
   * @return {Array} an Array of intervals, where each element is an interval for a
   * given currency indexed by {@link Currency.Currencies}
   */


  _createClass(EvaluatorVisitor, [{
    key: 'processAndNode',
    value: function processAndNode(node, left, right) {
      return zip(left, right).map(this.nodeEvaluators.and(node));
    }

    /**
     * Called during preorder traversal when processing {@link FincIfNode}.
     * Evaluates the current node using `NodeEvaluators.if`
     * (See {@link NodeEvaluators}) evaluator function by mapping over all currencies.
     * @override
     * @param  {FincNode} node node currently being processed
     * @param  {Array} left an array of intervals resulted from processing
     *   left child (first subtree) of the current node
     * @param  {Array} right an array of intervals resulted from processing
     *   right child (second subtree) of the current node
     * @return {Array} an Array of intervals, where each element is an interval for a
     * given currency indexed by {@link Currency.Currencies}
     */

  }, {
    key: 'processIfNode',
    value: function processIfNode(node, left, right) {
      return zip(left, right).map(this.nodeEvaluators.if(node));
    }

    /**
     * Called during preorder traversal when processing {@link FincOrNode}.
     * Evaluates the current node using `NodeEvaluators.or`
     * (See {@link NodeEvaluators}) evaluator function by mapping over all currencies.
     * @override
     * @param  {FincNode} node node currently being processed
     * @param  {Array} left an array of intervals resulted from processing
     *   left child (first subtree) of the current node
     * @param  {Array} right an array of intervals resulted from processing
     *   right child (second subtree) of the current node
     * @return {Array} an Array of intervals, where each element is an interval for a
     * given currency indexed by {@link Currency.Currencies}
     */

  }, {
    key: 'processOrNode',
    value: function processOrNode(node, left, right) {
      return zip(left, right).map(this.nodeEvaluators.or(node));
    }

    /**
     * Called during preorder traversal when processing {@link FincTimeboundNode}.
     * Evaluates the current node using `NodeEvaluators.timebound`
     * (See {@link NodeEvaluators}) evaluator function by mapping over all currencies.
     * @override
     * @param  {FincNode} node node currently being processed
     * @param  {Array} child an Array of intervals resulted from processisng
     *   the only child (its subtree) of the current node
     * @return {Array} an Array of intervals, where each element is an interval for a
     * given currency indexed by {@link Currency.Currencies}
     */

  }, {
    key: 'processTimeboundNode',
    value: function processTimeboundNode(node, child) {
      return child.map(this.nodeEvaluators.timebound(node));
    }

    /**
     * Called during preorder traversal when processing {@link FincGiveNode}.
     * Evaluates the current node using `NodeEvaluators.give`
     * (See {@link NodeEvaluators}) evaluator function by mapping over all currencies.
     * @override
     * @param  {FincNode} node node currently being processed
     * @param  {Array} child an Array of intervals resulted from processisng
     *   the only child (its subtree) of the current node
     * @return {Array} an Array of intervals, where each element is an interval for a
     * given currency indexed by {@link Currency.Currencies}
     */

  }, {
    key: 'processGiveNode',
    value: function processGiveNode(node, child) {
      return child.map(this.nodeEvaluators.give(node));
    }

    /**
     * Called during preorder traversal when processing {@link FincScaleObsNode}.
     * Evaluates the current node using `NodeEvaluators.scaleObs`
     * (See {@link NodeEvaluators}) evaluator function by mapping over all currencies.
     * @override
     * @param  {FincNode} node node currently being processed
     * @param  {Array} child an Array of intervals resulted from processisng
     *   the only child (its subtree) of the current node
     * @return {Array} an Array of intervals, where each element is an interval for a
     * given currency indexed by {@link Currency.Currencies}
     */

  }, {
    key: 'processScaleObsNode',
    value: function processScaleObsNode(node, child) {
      return child.map(this.nodeEvaluators.scaleObs(node));
    }

    /**
     * Called during preorder traversal when processing {@link FincScaleNode}.
     * Evaluates the current node using `NodeEvaluators.scale`
     * (See {@link NodeEvaluators}) evaluator function by mapping over all currencies.
     * @override
     * @param  {FincNode} node node currently being processed
     * @param  {Array} child an Array of intervals resulted from processisng
     *   the only child (its subtree) of the current node
     * @return {Array} an Array of intervals, where each element is an interval for a
     * given currency indexed by {@link Currency.Currencies}
     */

  }, {
    key: 'processScaleNode',
    value: function processScaleNode(node, child) {
      return child.map(this.nodeEvaluators.scale(node));
    }

    /**
     * Called during preorder traversal when processing {@link FincOneNode}.
     * Evaluates the current node using `NodeEvaluators.one`
     * (See {@link NodeEvaluators}) evaluator function by mapping over all currencies.
     * @override
     * @param  {FincNode} node node currently being processed
     * @return {Array} an Array of intervals, where each element is an interval for a
     * given currency indexed by {@link Currency.Currencies}
     */

  }, {
    key: 'processOneNode',
    value: function processOneNode(node) {
      return this.nodeEvaluators.one(node).call();
    }

    /**
     * Called during preorder traversal when processing {@link FincZeroNode}.
     * Evaluates the current node using `NodeEvaluators.zero`
     * (See {@link NodeEvaluators}) evaluator function by mapping over all currencies.
     * @override
     * @param  {FincNode} node node currently being processed
     * @return {Array} an Array of intervals, where each element is an interval for a
     * given currency indexed by {@link Currency.Currencies}
     */

  }, {
    key: 'processZeroNode',
    value: function processZeroNode(node) {
      return this.nodeEvaluators.zero(node).call();
    }

    /**
     * Called during preorder traversal when processing an unknown node
     * @override
     * @throws {Error} always
     */

  }, {
    key: 'processUnknownNode',
    value: function processUnknownNode() {
      throw new Error('Unknown case during evaluation');
    }
  }]);

  return EvaluatorVisitor;
}(_fincontractVisitor.Visitor);

/**
 * Evaluator class is used for performing different evaluation methods on a
 * Fincontracts' descriptions.
 * @example
 * import Fetcher from './fincontract-fetcher';
 * import Evaluator from './fincontract-evaluator';
 * import Currency from './currency';
 * const f = new Fetcher(marketplace);
 * const e = new Evaluator(web3, gateway);
 * const method = 'estimate';
 * const id = '<32 byte address of a deployed Fincontract>';
 * try {
 *   const fincontract = await f.pullFincontract(id);
 *   const evaluated   = await e.evaluate(fincontract.rootDescription, {method});
 *   const currencies  = Currency.convertToJSON(evaluated);
 *   const exchanged   = await Currency.changeAllCurrencies('USD', currencies);
 *   console.log(JSON.stringify(evaluated));
 *   console.log(JSON.stringify(exchanged));
 * } catch (err) {
 *   console.log(error(err));
 * }
 */


var Evaluator = function () {

  /**
   * Constructs the {@link Evaluator} object with a web3 instance and a Gateway
   * smart contract instance not connected to any address
   * @param {Web3} web3 a web3 instance connected to Ethereum node
   * @param {Gateway} gateway a gateway instance not connected to any address
   */
  function Evaluator(gateway, web3) {
    _classCallCheck(this, Evaluator);

    /** @private */
    this.web3 = web3;
    /** @private */
    this.gateway = gateway;
  }

  /**
   * Evaluates a description of {@link Fincontract}, actual evaluation is
   * delegated to {@link EvaluatorVisitor}. This method implements two options:
   * `direct` and `estimate` evaluation. `direct` updates Gateways in
   * all {@link FincScaleObsNode} and {@link FincIfNode} nodes before
   * performing evaluation. It then later calls these Gateways to
   * get the latest values. On the other hand
   * `estimate` evaluation needs an interval for {@link FincScaleObsNode} and
   * {@link FincIfNode} nodes are treated like {@link FincOrNode}, by assuming that
   * both sub-fincontracts are equally likely.
   *
   * @param  {FincNode} description root of {@link FincNode} tree for evaluation
   * @param  {Object} options
   * @param  {String} options.method Method for evaluating the description tree
   * @return {Promise} resolves promise if evaluation succeeded
   * with {Array} of currency intervals or rejects with Error if it failed
   */


  _createClass(Evaluator, [{
    key: 'evaluate',
    value: function () {
      var _ref9 = _asyncToGenerator(regeneratorRuntime.mark(function _callee(description, options) {
        var evaluators, ev, gu, _evaluators, _ev;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(options.method === 'direct')) {
                  _context.next = 9;
                  break;
                }

                evaluators = makeDirectEvaluators(this.web3, this.gateway);
                ev = new EvaluatorVisitor(evaluators);
                gu = new _fincontractGatewayUpdater2.default(this.web3, this.gateway);
                _context.next = 6;
                return gu.updateAllGateways(description);

              case 6:
                return _context.abrupt('return', Promise.resolve(ev.visit(description)));

              case 9:
                if (!(options.method === 'estimate')) {
                  _context.next = 13;
                  break;
                }

                _evaluators = makeEstimationEvaluators();
                _ev = new EvaluatorVisitor(_evaluators);
                return _context.abrupt('return', Promise.resolve(_ev.visit(description)));

              case 13:
                return _context.abrupt('return', Promise.reject(Error('Wrong evaluation method')));

              case 14:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function evaluate(_x, _x2) {
        return _ref9.apply(this, arguments);
      }

      return evaluate;
    }()
  }]);

  return Evaluator;
}();

exports.default = Evaluator;