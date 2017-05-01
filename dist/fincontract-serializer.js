'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SerializerVisitor = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fincontractVisitor = require('./fincontract-visitor');

var _currency = require('./currency');

var _currency2 = _interopRequireDefault(_currency);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var compressZero = function compressZero(addr) {
  return parseInt(addr, 16) ? addr : '0x0';
};

/**
 * {@link SerializerVisitor} performs the actual serialization of
 * a {@link FincNode} description tree into String by extending {@link Visitor}.
 * @extends {Visitor}
 */

var SerializerVisitor = exports.SerializerVisitor = function (_Visitor) {
  _inherits(SerializerVisitor, _Visitor);

  function SerializerVisitor() {
    _classCallCheck(this, SerializerVisitor);

    return _possibleConstructorReturn(this, (SerializerVisitor.__proto__ || Object.getPrototypeOf(SerializerVisitor)).apply(this, arguments));
  }

  _createClass(SerializerVisitor, [{
    key: 'processAndNode',


    /**
     * Called during preorder traversal when processing {@link FincAndNode}.
     * Serializes current node with its already serialized children.
     * @override
     * @param  {FincNode} node currently processed node
     * @param  {String} left a String containing result of
     *   serializing left child (first subtree) of the current node
     * @param  {String} right a String containing result of
     *   serializing right child (second subtree) of the current node
     * @return {String} a String that serializes the current node and all of its
     *   subtrees
     */
    value: function processAndNode(node, left, right) {
      return 'And(' + left + ',' + right + ')';
    }

    /**
     * Called during preorder traversal when processing {@link FincIfNode}.
     * Serializes current node with its already serialized children. Gateway's
     * address is compressed if it's a zero address to `0x0`.
     * @override
     * @param  {FincNode} node currently processed node
     * @param  {String} left a String containing result of
     *   serializing left child (first subtree) of the current node
     * @param  {String} right a String containing result of
     *   serializing right child (second subtree) of the current node
     * @return {String} a String that serializes the current node and all of its
     *   subtrees
     */

  }, {
    key: 'processIfNode',
    value: function processIfNode(node, left, right) {
      return 'If(' + compressZero(node.gatewayAddress) + ',' + left + ',' + right + ')';
    }

    /**
     * Called during preorder traversal when processing {@link FincOrNode}.
     * Serializes current node with its already serialized children.
     * @override
     * @param  {FincNode} node currently processed node
     * @param  {String} left a String containing result of
     *   serializing left child (first subtree) of the current node
     * @param  {String} right a String containing result of
     *   serializing right child (second subtree) of the current node
     * @return {String} a String that serializes the current node and all of its
     *   subtrees
     */

  }, {
    key: 'processOrNode',
    value: function processOrNode(node, left, right) {
      return 'Or(' + left + ',' + right + ')';
    }

    /**
     * Called during preorder traversal when processing {@link FincTimeboundNode}.
     * Serializes current node with its already serialized children.
     * @override
     * @param  {FincNode} node currently processed node
     * @param  {String} child a String containing result of
     *   serializing its only child (its subtree) of the current node
     * @return {String} a String that serializes the current node and its subtree
     */

  }, {
    key: 'processTimeboundNode',
    value: function processTimeboundNode(node, child) {
      return 'Timebound(' + node.lowerBound + ',' + node.upperBound + ',' + child + ')';
    }

    /**
     * Called during preorder traversal when processing {@link FincGiveNode}.
     * Serializes current node with its already serialized children.
     * @override
     * @param  {FincNode} node currently processed node
     * @param  {String} child a String containing result of
     *   serializing its only child (its subtree) of the current node
     * @return {String} a String that serializes the current node and its subtree
     */

  }, {
    key: 'processGiveNode',
    value: function processGiveNode(node, child) {
      return 'Give(' + child + ')';
    }

    /**
     * Called during preorder traversal when processing {@link FincScaleObsNode}.
     * Serializes current node with its already serialized children. Gateway's
     * address is compressed if it's a zero address to `0x0`.
     * @override
     * @param  {FincNode} node currently processed node
     * @param  {String} child a String containing result of
     *   serializing its only child (its subtree) of the current node
     * @return {String} a String that serializes the current node and its subtree
     */

  }, {
    key: 'processScaleObsNode',
    value: function processScaleObsNode(node, child) {
      return 'ScaleObs(' + compressZero(node.gatewayAddress) + ',' + child + ')';
    }

    /**
     * Called during preorder traversal when processing {@link FincScaleNode}.
     * Serializes current node with its already serialized children.
     * @override
     * @param  {FincNode} node currently processed node
     * @param  {String} child a String containing result of
     *   serializing its only child (its subtree) of the current node
     * @return {String} a String that serializes the current node and its subtree
     */

  }, {
    key: 'processScaleNode',
    value: function processScaleNode(node, child) {
      return 'Scale(' + node.scale + ',' + child + ')';
    }

    /**
     * Called during preorder traversal when processing {@link FincOneNode}.
     * Serializes current node.
     * @override
     * @param  {FincNode} node currently processed node
     * @return {String} a String that serializes the current node.
     */

  }, {
    key: 'processOneNode',
    value: function processOneNode(node) {
      return 'One(' + _currency2.default.Currencies[node.currency] + ')';
    }

    /**
     * Called during preorder traversal when processing {@link FincZeroNode}.
     * Serializes current node.
     * @override
     * @return {String} a String that serializes the current node.
     */

  }, {
    key: 'processZeroNode',
    value: function processZeroNode() {
      return 'Zero()';
    }

    /**
     * Called during preorder traversal when processing an unknown node.
     * Throws an error.
     * @override
     * @throws {Error} always
     */

  }, {
    key: 'processUnknownNode',
    value: function processUnknownNode() {
      throw new Error('Unknown case during serialization!');
    }
  }]);

  return SerializerVisitor;
}(_fincontractVisitor.Visitor);

/**
 * {@link Serializer} class allows for serialization of Fincontracts. It
 * delegates the serialization of the description tree ({@link FincNode} tree)
 * to {@link SerializerVisitor} and serializes the rest of the properties.
 * @example
 * import Serializer from './fincontract-serializer';
 * const fincontract = ...;
 * const srz = new Serializer();
 * const serialized = srz.serialize(fincontract);
 * console.log(JSON.stringify(serialized));
 */


var Serializer = function () {

  /**
   * Constructs {@link Serializer} object.
   */
  function Serializer() {
    _classCallCheck(this, Serializer);

    /** @private */
    this.sv = new SerializerVisitor();
  }

  /**
   * Serializes a Fincontract {@link Fincontract} to a plain-old Java Script
   * object that can be easily converted to JSON, by calling `JSON.stringify`.
   * All address are compressed, meaning a zero address is compressed to `0x0`
   * @param  {Fincontract} fincontract a Fincontract instance
   * @return {Object} the serialized object
   */


  _createClass(Serializer, [{
    key: 'serialize',
    value: function serialize(fincontract) {
      return {
        id: compressZero(fincontract.id),
        owner: compressZero(fincontract.owner),
        issuer: compressZero(fincontract.issuer),
        proposedOwner: compressZero(fincontract.proposedOwner),
        description: this.sv.visit(fincontract.rootDescription)
      };
    }
  }]);

  return Serializer;
}();

exports.default = Serializer;