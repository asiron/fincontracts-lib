import * as math from 'mathjs';
import * as finc from './fincontract';
import {getCurrencyIndex} from './currency';

export default class Parser {

  parse(expression) {
    return new Promise((resolve, reject) => {
      try {
        resolve(this.visit(math.parse(expression)));
      } catch (err) {
        reject(err);
      }
    });
  }

  visit(node) {
    switch (node.fn.name) {

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
        return new finc.FincScaleNode(child, node.args[0].value);
      }

      case 'One':
        return new finc.FincOneNode(getCurrencyIndex(node.args[0].name));

      case 'Zero':
        return new finc.FincZeroNode();

      default: throw new Error('Unknown case during parsing');
    }
  }

  parseAddress(node) {
    return '0x' + (node.args[0].value || node.args[0].args[1].name.slice(1));
  }
}
