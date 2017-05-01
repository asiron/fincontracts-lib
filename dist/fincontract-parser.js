'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mathjs = require('mathjs');

var math = _interopRequireWildcard(_mathjs);

var _fincontract = require('./fincontract');

var finc = _interopRequireWildcard(_fincontract);

var _currency = require('./currency');

var _currency2 = _interopRequireDefault(_currency);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * {@link Parser} class allows for parsing Fincontract descriptions, using
 * `math.js` as its back-end.
 * @example
 * import Parser from './fincontract-parser';
 * try {
 *   const p = new Parser();
 *   const expression = 'And(Give(Scale(11,One(USD))),Scale(10,One(EUR)))';
 *   const desc = await p.parse(expression);
 * } catch (err) {
 *   console.log(err);
 * }
 */
var Parser = function () {
  function Parser() {
    _classCallCheck(this, Parser);
  }

  _createClass(Parser, [{
    key: 'parse',


    /**
     * Parses the Fincontract description expression and creates
     * a {@link FincNode} description tree. The expression has to be well-defined
     * meaning it cannot contain white characters, it has to have balanced
     * parentheses and contain only valid primitives (keywords) as described in
     * the paper. Keywords `At`, `Before` and `After` are also supported.
     * {@link https://orbilu.uni.lu/bitstream/10993/30975/1/Findel_2017-03-08-CR.pdf}
     * @param  {String} expression - well-defined Fincontract description
     * @return {FincNode} {@link FincNode} description tree
     */
    value: function parse(expression) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        try {
          resolve(_this.visit(math.parse(expression)));
        } catch (err) {
          reject(err);
        }
      });
    }

    /**
     * Traverses the Abstract Syntax Tree, that was output from `math.js#parse`
     * function and recursively constructs {@link FincNode} description tree.
     * @throws {Error} If unknown node is processed
     * @param  {Object} node - node of AST from `math.js#parse`
     * @return {FincNode} - currently constructed {@link FincNode}
     */

  }, {
    key: 'visit',
    value: function visit(node) {
      switch (node.fn.name) {

        case 'At':
          {
            var at = parseInt(node.args[0].value, 10);
            var begin = at - Parser.Delta / 2;
            var end = at + Parser.Delta / 2;
            var child = this.visit(node.args[1]);
            return new finc.FincTimeboundNode(child, begin, end);
          }

        case 'Before':
          {
            var _end = parseInt(node.args[0].value, 10);
            var _child = this.visit(node.args[1]);
            return new finc.FincTimeboundNode(_child, 0, _end);
          }

        case 'After':
          {
            var _begin = parseInt(node.args[0].value, 10);
            var _end2 = Date.now() / 1000 + Parser.Expiration;
            var _child2 = this.visit(node.args[1]);
            return new finc.FincTimeboundNode(_child2, _begin, _end2);
          }

        case 'Timebound':
          {
            var _begin2 = parseInt(node.args[0].value, 10);
            var _end3 = parseInt(node.args[1].value, 10);
            var _child3 = this.visit(node.args[2]);
            return new finc.FincTimeboundNode(_child3, _begin2, _end3);
          }

        case 'And':
          {
            var left = this.visit(node.args[0]);
            var right = this.visit(node.args[1]);
            return new finc.FincAndNode(left, right);
          }

        case 'If':
          {
            var addr = this.parseAddress(node);
            var _left = this.visit(node.args[1]);
            var _right = this.visit(node.args[2]);
            return new finc.FincIfNode(_left, _right, addr);
          }

        case 'Or':
          {
            var _left2 = this.visit(node.args[0]);
            var _right2 = this.visit(node.args[1]);
            return new finc.FincOrNode(_left2, _right2);
          }

        case 'Give':
          {
            var _child4 = this.visit(node.args[0]);
            return new finc.FincGiveNode(_child4);
          }

        case 'ScaleObs':
          {
            var _addr = this.parseAddress(node);
            var _child5 = this.visit(node.args[1]);
            return new finc.FincScaleObsNode(_child5, _addr);
          }

        case 'Scale':
          {
            var _child6 = this.visit(node.args[1]);
            return new finc.FincScaleNode(_child6, node.args[0].value);
          }

        case 'One':
          return new finc.FincOneNode(_currency2.default.getCurrencyIndex(node.args[0].name));

        case 'Zero':
          return new finc.FincZeroNode();

        default:
          throw new Error('Unknown case during parsing');
      }
    }

    /**
     * Parses address from a AST node. Address in form `0x....` has to be
     * processed further since `math.js` interprets `0x...` as multiplication.
     * @param  {Object} node - current AST node containing address
     * @return {String} address - parsed address as String
     */

  }, {
    key: 'parseAddress',
    value: function parseAddress(node) {
      return '0x' + (node.args[0].value || node.args[0].args[1].name.slice(1));
    }
  }], [{
    key: 'Delta',


    /**
     * Time tolerance for `At` primitive in seconds.
     * If `At` primitive is scheduled at time `t` then the Fincontract
     * will only be valid from `t - Delta/2` to `t + Delta/2`.
     * By default it's 30 seconds.
     * @type {Number}
     */
    get: function get() {
      return 30;
    }

    /**
     * Expiration time for Fincontracts. All Fincontracts expire by default after
     * `1 year`. Where `1 year` is not exactly `1 year`,
     * but `3600 * 24 * 365` seconds
     * @type {Number}
     */

  }, {
    key: 'Expiration',
    get: function get() {
      return 3600 * 24 * 365;
    }
  }]);

  return Parser;
}();

exports.default = Parser;