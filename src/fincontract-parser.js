import * as math from 'mathjs';
import * as finc from './fincontract';
import Currency from './currency';

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
export default class Parser {

  /**
   * Time tolerance for `At` primitive in seconds.
   * If `At` primitive is scheduled at time `t` then the Fincontract
   * will only be valid from `t - Delta/2` to `t + Delta/2`.
   * By default it's 30 seconds.
   * @type {Number}
   */
  static get Delta() {
    return 30;
  }

  /**
   * Expiration time for Fincontracts. All Fincontracts expire by default after
   * `1 year`. Where `1 year` is not exactly `1 year`,
   * but `3600 * 24 * 365` seconds
   * @type {Number}
   */
  static get Expiration() {
    return 3600 * 24 * 365;
  }

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
  parse(expression) {
    return new Promise((resolve, reject) => {
      try {
        resolve(this.visit(math.parse(expression)));
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
  visit(node) {
    switch (node.fn.name) {

      case 'At': {
        const at = parseInt(node.args[0].value, 10);
        const begin = at - (Parser.Delta / 2);
        const end = at + (Parser.Delta / 2);
        const child = this.visit(node.args[1]);
        return new finc.FincTimeboundNode(child, begin, end);
      }

      case 'Before': {
        const end = parseInt(node.args[0].value, 10);
        const child = this.visit(node.args[1]);
        return new finc.FincTimeboundNode(child, 0, end);
      }

      case 'After': {
        const begin = parseInt(node.args[0].value, 10);
        const end = (Date.now() / 1000) + Parser.Expiration;
        const child = this.visit(node.args[1]);
        return new finc.FincTimeboundNode(child, begin, end);
      }

      case 'Timebound': {
        const begin = parseInt(node.args[0].value, 10);
        const end = parseInt(node.args[1].value, 10);
        const child = this.visit(node.args[2]);
        return new finc.FincTimeboundNode(child, begin, end);
      }

      case 'And': {
        const left = this.visit(node.args[0]);
        const right = this.visit(node.args[1]);
        return new finc.FincAndNode(left, right);
      }

      case 'If': {
        const addr = this.parseAddress(node);
        const left = this.visit(node.args[1]);
        const right = this.visit(node.args[2]);
        return new finc.FincIfNode(left, right, addr);
      }

      case 'Or': {
        const left = this.visit(node.args[0]);
        const right = this.visit(node.args[1]);
        return new finc.FincOrNode(left, right);
      }

      case 'Give': {
        const child = this.visit(node.args[0]);
        return new finc.FincGiveNode(child);
      }

      case 'ScaleObs': {
        const addr = this.parseAddress(node);
        const child = this.visit(node.args[1]);
        return new finc.FincScaleObsNode(child, addr);
      }

      case 'Scale': {
        const child = this.visit(node.args[1]);
        return new finc.FincScaleNode(child, this.parseScale(node));
      }

      case 'One':
        return new finc.FincOneNode(
          parseInt(Currency.getCurrencyIndex(node.args[0].name), 10)
        );

      case 'Zero':
        return new finc.FincZeroNode();

      default: throw new Error('Unknown case during parsing');
    }
  }

  /**
   * Parses scale from an AST node. Negative scales have to be
   * processed further since `math.js` interprets e.g. `-4` as operation.
   * @param  {Object} node - current AST node containing an integer scale factor
   * @return {String} address - parsed integer scale factor as String
   */
  parseScale(node) {
    return parseInt(node.args[0].value || -node.args[0].args[0], 10);
  }

  /**
   * Parses address from an AST node. Address in form `0x....` has to be
   * processed further since `math.js` interprets `0x...` as multiplication.
   * @param  {Object} node - current AST node containing address
   * @return {String} address - parsed address as String
   */
  parseAddress(node) {
    const address = '0x' + (node.args[0].value || node.args[0].args[1].name.slice(1));
    return parseInt(address, 16) ? address : '0x0';
  }
}
