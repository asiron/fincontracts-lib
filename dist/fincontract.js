"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * {@link Fincontract} describes an instance of a Fincontract in memory.
 * It is usually fetched from the blockchain using
 * {@link Fetcher#pullFincontract}. Its description can be also constructed
 * using {@link Parser#parse}
 */
var Fincontract =

/**
 * @param  {Object} kwargs
 * @param  {String} kwargs.id - 32-byte blockchain deployed ID
 * @param  {String} kwargs.owner - 32-byte address of an Ethereum account,
 *   who owns the Fincontract
 * @param  {String} kwargs.issuer - 32-byte address of an Ethereum account,
 *   who the Fincontract was issued for
 * @param  {String} kwargs.proposedOwner - 32-byte address of an Ethereum
 *   account, who is the proposed owner, an account that can join
 *   (see {@link Executor#join}) the Fincontract
 *  @param {FincNode} kwargs.rootDescription - root of the description tree
 */
exports.Fincontract = function Fincontract(kwargs) {
  _classCallCheck(this, Fincontract);

  /**
   * 32-byte blockchain deployed ID
   * @type {String}
   */
  this.id = kwargs.id;
  /**
   * 32-byte address of an Ethereum account, who owns the Fincontract
   * @type {String}
   */
  this.owner = kwargs.owner;
  /**
   * 32-byte address of an Ethereum account, who the Fincontract
   * was issued for
   * @type {String}
   */
  this.issuer = kwargs.issuer;
  /**
   * 32-byte address of an Ethereum account, who is the proposed owner,
   * an account that can join (see {@link Executor#join}) the Fincontract
   * @type {String}
   */
  this.proposedOwner = kwargs.proposedOwner;
  /**
   * Root of the description tree
   * @type {FincNode}
   */
  this.rootDescription = kwargs.rootDescription;
};

/**
 * {@link FincNode} is the superclass for all primitives. It contains a list of
 * pointers to children. The number of children varies from `0` to `2` depending
 * on the inheriting node type.
 * @abstract
 */


var FincNode =
/**
 * Constructs {@link FincNode} with an Array of children
 * @param  {Array<FincNode>} children - an Array of children
 */
exports.FincNode = function FincNode(children) {
  _classCallCheck(this, FincNode);

  /** @private */
  this.children = children;
};

/**
 * {@link FincTimeboundNode} extends {@link FincNode} and implements
 * `Timebound` primitive, which takes a sub-fincontract and makes it valid only
 * if the current timestamp is between {@link FincTimeboundNode.lowerBound} and
 * {@link FincTimeboundNode.upperBound}.
 * @extends {FincNode}
 */


var FincTimeboundNode = exports.FincTimeboundNode = function (_FincNode) {
  _inherits(FincTimeboundNode, _FincNode);

  /**
   * @param  {FincNode} child - a sub-fincontract to be embedded inside
   *   {@link FincTimeboundNode}
   * @param  {Number} lowerBound - lower bound as Unix timestamp in seconds
   * @param  {Number} upperBound - upper bound as Unix timestamp in seconds
   */
  function FincTimeboundNode(child, lowerBound, upperBound) {
    _classCallCheck(this, FincTimeboundNode);

    /**
     * Lower bound as Unix timestamp in seconds
     * @type {Number}
     */
    var _this = _possibleConstructorReturn(this, (FincTimeboundNode.__proto__ || Object.getPrototypeOf(FincTimeboundNode)).call(this, child));

    _this.lowerBound = lowerBound;
    /**
     * Upper bound as Unix timestamp in seconds
     * @type {Number}
     */
    _this.upperBound = upperBound;
    return _this;
  }

  return FincTimeboundNode;
}(FincNode);

/**
 * {@link FincAndNode} extends {@link FincNode} and implements
 * `And` primitive, which takes two sub-fincontracts and makes them both valid.
 * Meaning that the payer has to pay now both of them.
 * @extends {FincNode}
 */


var FincAndNode = exports.FincAndNode = function (_FincNode2) {
  _inherits(FincAndNode, _FincNode2);

  /**
   * Constructs {@link FincAndNode} with two children
   * @param  {FincNode} leftChild  - first sub-fincontract to be embedded
   * @param  {FincNode} rightChild - second sub-fincontract to be embedded
   */
  function FincAndNode(leftChild, rightChild) {
    _classCallCheck(this, FincAndNode);

    return _possibleConstructorReturn(this, (FincAndNode.__proto__ || Object.getPrototypeOf(FincAndNode)).call(this, [leftChild, rightChild]));
  }

  return FincAndNode;
}(FincNode);

/**
 * {@link FincOrNode} extends {@link FincNode} and implements
 * `Or` primitive, which takes two sub-fincontracts and allows the owner to
 * choose only one of them. The other contract becomes invalid upon choice.
 * @extends {FincNode}
 */


var FincOrNode = exports.FincOrNode = function (_FincNode3) {
  _inherits(FincOrNode, _FincNode3);

  /**
   * Constructs {@link FincOrNode} with two children
   * @param  {FincNode} leftChild  - first sub-fincontract to be embedded
   * @param  {FincNode} rightChild - second sub-fincontract to be embedded
   */
  function FincOrNode(leftChild, rightChild) {
    _classCallCheck(this, FincOrNode);

    return _possibleConstructorReturn(this, (FincOrNode.__proto__ || Object.getPrototypeOf(FincOrNode)).call(this, [leftChild, rightChild]));
  }

  return FincOrNode;
}(FincNode);

/**
 * {@link FincIfNode} extends {@link FincNode} and implements
 * `If` primitive, which takes two sub-fincontracts and a Gateway address.
 * Upon execution Gateway defines, which sub-fincontract is valid and which is
 * not. If Gateway returns `1` then the first sub-fincontract is chosen,
 * otherwise second sub-fincontract is chosen. Gateway has to conform to
 * the Gateway interface (see Gateway smart contract at
 * {@link FincontractMarketplace}).
 * @extends {FincNode}
 */


var FincIfNode = exports.FincIfNode = function (_FincNode4) {
  _inherits(FincIfNode, _FincNode4);

  /**
   * Constructs {@link FincIfNode} with two children and a Gateway address
   * @param  {FincNode} leftChild  - first sub-fincontract to be embedded
   * @param  {FincNode} rightChild - second sub-fincontract to be embedded
   * @param  {String} gatewayAddress - 32-byte address of the blockchain
   *   deployed Gateway
   */
  function FincIfNode(leftChild, rightChild, gatewayAddress) {
    _classCallCheck(this, FincIfNode);

    /**
     * 32-byte address of the blockchain deployed Gateway
     * @type {String}
     */
    var _this4 = _possibleConstructorReturn(this, (FincIfNode.__proto__ || Object.getPrototypeOf(FincIfNode)).call(this, [leftChild, rightChild]));

    _this4.gatewayAddress = gatewayAddress;
    return _this4;
  }

  return FincIfNode;
}(FincNode);

/**
 * {@link FincScaleObsNode} extends {@link FincNode} and implements
 * `ScaleObs` primitive, which takes a sub-fincontract and a Gateway address.
 * Upon execution, the sub-fincontract is scaled by the value obtained from the
 * Gateway. Gateway has to conform to the Gateway interface
 * (see Gateway smart contract at {@link FincontractMarketplace}).
 * @extends {FincNode}
 */


var FincScaleObsNode = exports.FincScaleObsNode = function (_FincNode5) {
  _inherits(FincScaleObsNode, _FincNode5);

  /**
   * @param  {FincNode} child - a sub-fincontract to be embedded inside
   *   {@link FincScaleObsNode}
   * @param  {String} gatewayAddress - 32-byte address of the blockchain
   *   deployed Gateway
   */
  function FincScaleObsNode(child, gatewayAddress) {
    _classCallCheck(this, FincScaleObsNode);

    /**
     * 32-byte address of the blockchain deployed Gateway
     * @type {String}
     */
    var _this5 = _possibleConstructorReturn(this, (FincScaleObsNode.__proto__ || Object.getPrototypeOf(FincScaleObsNode)).call(this, child));

    _this5.gatewayAddress = gatewayAddress;
    return _this5;
  }

  return FincScaleObsNode;
}(FincNode);

/**
 * {@link FincScaleNode} extends {@link FincNode} and implements
 * `Scale` primitive, which takes a sub-fincontract and a {@link Number}.
 * Upon execution, the sub-fincontract is scaled by the value of the
 * integer {@link FincScaleNode.scale}
 * @extends {FincNode}
 */


var FincScaleNode = exports.FincScaleNode = function (_FincNode6) {
  _inherits(FincScaleNode, _FincNode6);

  /**
   * @param  {FincNode} child - a sub-fincontract to be embedded inside
   *   {@link FincScaleNode}
   * @param  {Number} scale - integer scale factor
   */
  function FincScaleNode(child, scale) {
    _classCallCheck(this, FincScaleNode);

    /**
     * Integer scale factor
     * @type {Number}
     */
    var _this6 = _possibleConstructorReturn(this, (FincScaleNode.__proto__ || Object.getPrototypeOf(FincScaleNode)).call(this, child));

    _this6.scale = scale;
    return _this6;
  }

  return FincScaleNode;
}(FincNode);

/**
 * {@link FincOneNode} extends {@link FincNode} and implements
 * `One` primitive, which takes a currency index (see {@link CurrenciesType})
 * and always requires payer to pay `1` of that currency upon execution.
 * @extends {FincNode}
 */


var FincOneNode = exports.FincOneNode = function (_FincNode7) {
  _inherits(FincOneNode, _FincNode7);

  /**
   * @param  {Number} currency - a currency index
   */
  function FincOneNode(currency) {
    _classCallCheck(this, FincOneNode);

    /**
     * Currency index, must be one of the supported ones.
     * @type {Number}
     */
    var _this7 = _possibleConstructorReturn(this, (FincOneNode.__proto__ || Object.getPrototypeOf(FincOneNode)).call(this, null));

    _this7.currency = currency;
    return _this7;
  }

  return FincOneNode;
}(FincNode);

/**
 * {@link FincGiveNode} extends {@link FincNode} and implements
 * `Give` primitive, which upon execution flips the payer with the payee
 * @extends {FincNode}
 */


var FincGiveNode = exports.FincGiveNode = function (_FincNode8) {
  _inherits(FincGiveNode, _FincNode8);

  function FincGiveNode() {
    _classCallCheck(this, FincGiveNode);

    return _possibleConstructorReturn(this, (FincGiveNode.__proto__ || Object.getPrototypeOf(FincGiveNode)).apply(this, arguments));
  }

  return FincGiveNode;
}(FincNode);

/**
 * {@link FincZeroNode} extends {@link FincNode} and implements
 * `Zero` primitive, which upon execution does nothing. There are no rights and
 * obligations.
 * @extends {FincNode}
 */


var FincZeroNode = exports.FincZeroNode = function (_FincNode9) {
  _inherits(FincZeroNode, _FincNode9);

  function FincZeroNode() {
    _classCallCheck(this, FincZeroNode);

    return _possibleConstructorReturn(this, (FincZeroNode.__proto__ || Object.getPrototypeOf(FincZeroNode)).apply(this, arguments));
  }

  return FincZeroNode;
}(FincNode);