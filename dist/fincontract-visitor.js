'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EmptyVisitor = exports.CollectingVisitor = exports.Visitor = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fincontract = require('./fincontract');

var finc = _interopRequireWildcard(_fincontract);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * {@link Visitor} implements pre-order tree traversal for Fincontract
 * description trees (see {@link FincNode}). This allows for subclassing to
 * achieve functionality like: serialization, evaluation and deployment.
 */
var Visitor = exports.Visitor = function () {
  function Visitor() {
    _classCallCheck(this, Visitor);
  }

  _createClass(Visitor, [{
    key: 'visit',


    /**
     * Visits current node.
     * Before calling the actual method that processes the
     * current node, it will visit all of its children and pass the results
     * to the function that processes the current node.
     * @param  {FincNode} node - currently being processed node
     * @return {Object} result from processing current node
     */
    value: function visit(node) {
      switch (node.constructor) {

        case finc.FincAndNode:
          {
            var left = this.visit(node.children[0]);
            var right = this.visit(node.children[1]);
            return this.processAndNode(node, left, right);
          }

        case finc.FincIfNode:
          {
            var _left = this.visit(node.children[0]);
            var _right = this.visit(node.children[1]);
            return this.processIfNode(node, _left, _right);
          }

        case finc.FincOrNode:
          {
            var _left2 = this.visit(node.children[0]);
            var _right2 = this.visit(node.children[1]);
            return this.processOrNode(node, _left2, _right2);
          }

        case finc.FincTimeboundNode:
          {
            var child = this.visit(node.children);
            return this.processTimeboundNode(node, child);
          }

        case finc.FincGiveNode:
          {
            var _child = this.visit(node.children);
            return this.processGiveNode(node, _child);
          }

        case finc.FincScaleObsNode:
          {
            var _child2 = this.visit(node.children);
            return this.processScaleObsNode(node, _child2);
          }

        case finc.FincScaleNode:
          {
            var _child3 = this.visit(node.children);
            return this.processScaleNode(node, _child3);
          }

        case finc.FincOneNode:
          return this.processOneNode(node);

        case finc.FincZeroNode:
          return this.processZeroNode();

        default:
          return this.processUnknownNode();

      }
    }

    /**
     * Called when processing {@link FincAndNode}.
     * @abstract
     * @return {Object} result of processing {@link FincAndNode}
     */

  }, {
    key: 'processAndNode',
    value: function processAndNode() {
      throw new Error('FincAndNode: must be implemented by subclass!');
    }

    /**
     * Called when processing {@link FincIfNode}.
     * @abstract
     * @return {Object} result of processing {@link FincIfNode}
     */

  }, {
    key: 'processIfNode',
    value: function processIfNode() {
      throw new Error('FincIfNode: must be implemented by subclass!');
    }

    /**
     * Called when processing {@link FincOrNode}.
     * @abstract
     * @return {Object} result of processing {@link FincOrNode}
     */

  }, {
    key: 'processOrNode',
    value: function processOrNode() {
      throw new Error('FincOrNode: must be implemented by subclass!');
    }

    /**
     * Called when processing {@link FincTimeboundNode}.
     * @abstract
     * @return {Object} result of processing {@link FincTimeboundNode}
     */

  }, {
    key: 'processTimeboundNode',
    value: function processTimeboundNode() {
      throw new Error('FincTimeboundNode: must be implemented by subclass!');
    }

    /**
     * Called when processing {@link FincScaleObsNode}.
     * @abstract
     * @return {Object} result of processing {@link FincScaleObsNode}
     */

  }, {
    key: 'processScaleObsNode',
    value: function processScaleObsNode() {
      throw new Error('FincScaleObsNode: must be implemented by subclass!');
    }

    /**
     * Called when processing {@link FincScaleNode}.
     * @abstract
     * @return {Object} result of processing {@link FincScaleNode}
     */

  }, {
    key: 'processScaleNode',
    value: function processScaleNode() {
      throw new Error('FincScaleNode: must be implemented by subclass!');
    }

    /**
     * Called when processing {@link FincGiveNode}.
     * @abstract
     * @return {Object} result of processing {@link FincGiveNode}
     */

  }, {
    key: 'processGiveNode',
    value: function processGiveNode() {
      throw new Error('FincGiveNode: must be implemented by subclass!');
    }

    /**
     * Called when processing {@link FincOneNode}.
     * @abstract
     * @return {Object} result of processing {@link FincOneNode}
     */

  }, {
    key: 'processOneNode',
    value: function processOneNode() {
      throw new Error('FincOneNode: must be implemented by subclass!');
    }

    /**
     * Called when processing {@link FincZeroNode}.
     * @abstract
     * @return {Object} result of processing {@link FincZeroNode}
     */

  }, {
    key: 'processZeroNode',
    value: function processZeroNode() {
      throw new Error('FincZeroNode: must be implemented by subclass!');
    }
  }]);

  return Visitor;
}();

/**
 * {@link CollectingVisitor} extends {@link Visitor} by providing default
 * functionality of collecting all leaf nodes. By default leaf-nodes return
 * an empty list, so the result is an empty list as well. An example of usage
 * is the {@link GatewayVisitor} which collects all Gateways from the tree.
 * @extends {Visitor}
 */


var CollectingVisitor = exports.CollectingVisitor = function (_Visitor) {
  _inherits(CollectingVisitor, _Visitor);

  function CollectingVisitor() {
    _classCallCheck(this, CollectingVisitor);

    return _possibleConstructorReturn(this, (CollectingVisitor.__proto__ || Object.getPrototypeOf(CollectingVisitor)).apply(this, arguments));
  }

  _createClass(CollectingVisitor, [{
    key: 'processAndNode',


    /**
     * Called during preorder traversal when processing {@link FincAndNode}.
     * Returns a list that concatenates the results from processing both left
     * and right subtrees
     * @override
     * @param  {FincNode} node currently processed node
     * @param  {Object} left an Object containing result of
     *   processing left child (first subtree) of the current node
     * @param  {Object} right an Object containing result of
     *   processing right child (second subtree) of the current node
     * @return {Array} an Array that contains the concatenated results from
     *   processing both left and right subtrees
     */
    value: function processAndNode(node, left, right) {
      return [].concat(_toConsumableArray(left), _toConsumableArray(right));
    }

    /**
     * Called during preorder traversal when processing {@link FincIfNode}.
     * Returns a list that concatenates the results from processing both left
     * and right subtrees
     * @override
     * @param  {FincNode} node currently processed node
     * @param  {Object} left an Object containing result of
     *   processing left child (first subtree) of the current node
     * @param  {Object} right an Object containing result of
     *   processing right child (second subtree) of the current node
     * @return {Array} an Array that contains the concatenated results from
     *   processing both left and right subtrees
     */

  }, {
    key: 'processIfNode',
    value: function processIfNode(node, left, right) {
      return [].concat(_toConsumableArray(left), _toConsumableArray(right));
    }

    /**
     * Called during preorder traversal when processing {@link FincOrNode}.
     * Returns a list that concatenates the results from processing both left
     * and right subtrees
     * @override
     * @param  {FincNode} node currently processed node
     * @param  {Object} left an Object containing result of
     *   processing left child (first subtree) of the current node
     * @param  {Object} right an Object containing result of
     *   processing right child (second subtree) of the current node
     * @return {Array} an Array that contains the concatenated results from
     *   processing both left and right subtrees
     */

  }, {
    key: 'processOrNode',
    value: function processOrNode(node, left, right) {
      return [].concat(_toConsumableArray(left), _toConsumableArray(right));
    }

    /**
     * Called during preorder traversal when processing {@link FincTimeboundNode}.
     * Passes the result from child to parent.
     * @override
     * @param  {FincNode} node currently processed node
     * @param  {Object} child an Object containing result of
     *   processing the only child (its subtree) of the current node
      * @return {Object} returns the result of processing the only child
     */

  }, {
    key: 'processTimeboundNode',
    value: function processTimeboundNode(node, child) {
      return child;
    }

    /**
     * Called during preorder traversal when processing {@link FincScaleObsNode}.
     * Passes the result from child to parent.
     * @override
     * @param  {FincNode} node currently processed node
     * @param  {Object} child an Object containing result of
     *   processing the only child (its subtree) of the current node
      * @return {Object} returns the result of processing the only child
     */

  }, {
    key: 'processScaleObsNode',
    value: function processScaleObsNode(node, child) {
      return child;
    }

    /**
     * Called during preorder traversal when processing {@link FincScaleNode}.
     * Passes the result from child to parent.
     * @override
     * @param  {FincNode} node currently processed node
     * @param  {Object} child an Object containing result of
     *   processing the only child (its subtree) of the current node
      * @return {Object} returns the result of processing the only child
     */

  }, {
    key: 'processScaleNode',
    value: function processScaleNode(node, child) {
      return child;
    }

    /**
     * Called during preorder traversal when processing {@link FincGiveNode}.
     * Passes the result from child to parent.
     * @override
     * @param  {FincNode} node currently processed node
     * @param  {Object} child an Object containing result of
     *   processing the only child (its subtree) of the current node
      * @return {Object} returns the result of processing the only child
     */

  }, {
    key: 'processGiveNode',
    value: function processGiveNode(node, child) {
      return child;
    }

    /**
     * Called during preorder traversal when processing {@link FincOneNode}.
     * Returns an empty list.
     * @override
     * @return {Array} an empty list
     */

  }, {
    key: 'processOneNode',
    value: function processOneNode() {
      return [];
    }

    /**
     * Called during preorder traversal when processing {@link FincZeroNode}.
     * Returns an empty list.
     * @override
     * @return {Array} an empty list
     */

  }, {
    key: 'processZeroNode',
    value: function processZeroNode() {
      return [];
    }
  }]);

  return CollectingVisitor;
}(Visitor);

/**
 * {@link EmptyVisitor} extends {@link Visitor}. All functions return nulls.
 * It's useful for implementing things like checking if there exists a path from
 * root to nearest OR node while only passing through `Scale` and `Timebound`
 * nodes. This is something that has to be check, before sending `executeOr`
 * transaction.
 */


var EmptyVisitor = exports.EmptyVisitor = function (_Visitor2) {
  _inherits(EmptyVisitor, _Visitor2);

  function EmptyVisitor() {
    _classCallCheck(this, EmptyVisitor);

    return _possibleConstructorReturn(this, (EmptyVisitor.__proto__ || Object.getPrototypeOf(EmptyVisitor)).apply(this, arguments));
  }

  _createClass(EmptyVisitor, [{
    key: 'processAndNode',


    /**
     * Called during preorder traversal when processing {@link FincAndNode}.
     * @override
     * @return {null}
     */
    value: function processAndNode() {}

    /**
     * Called during preorder traversal when processing {@link FincIfNode}.
     * @override
     * @return {null}
     */

  }, {
    key: 'processIfNode',
    value: function processIfNode() {}

    /**
     * Called during preorder traversal when processing {@link FincOrNode}.
     * @override
     * @return {null}
     */

  }, {
    key: 'processOrNode',
    value: function processOrNode() {}

    /**
     * Called during preorder traversal when processing {@link FincTimeboundNode}.
     * @override
     * @return {null}
     */

  }, {
    key: 'processTimeboundNode',
    value: function processTimeboundNode() {}

    /**
     * Called during preorder traversal when processing {@link FincScaleObsNode}.
     * @override
     * @return {null}
     */

  }, {
    key: 'processScaleObsNode',
    value: function processScaleObsNode() {}

    /**
     * Called during preorder traversal when processing {@link FincScaleNode}.
     * @override
     * @return {null}
     */

  }, {
    key: 'processScaleNode',
    value: function processScaleNode() {}

    /**
     * Called during preorder traversal when processing {@link FincGiveNode}.
     * @override
     * @return {null}
     */

  }, {
    key: 'processGiveNode',
    value: function processGiveNode() {}

    /**
     * Called during preorder traversal when processing {@link FincOneNode}.
     * @override
     * @return {null}
     */

  }, {
    key: 'processOneNode',
    value: function processOneNode() {}

    /**
     * Called during preorder traversal when processing {@link FincZeroNode}.
     * @override
     * @return {null}
     */

  }, {
    key: 'processZeroNode',
    value: function processZeroNode() {}
  }]);

  return EmptyVisitor;
}(Visitor);