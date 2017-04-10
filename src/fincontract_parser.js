const math = require('mathjs');
const finc = require('./fincontract');

const getKey = (obj,val) => Object.keys(obj).find(key => obj[key] === val);
const getCurrencyIndex = (name) => getKey(finc.Currencies, name)

export class Parser {
  
  constructor() {}

  parse(expression) {
    return this.visit(math.parse(expression));
  }

  visit(node) {

    switch (node.fn.name) {
      
      case 'Timebound': {
        let begin = parseInt(node.args[0].value);
        let end   = parseInt(node.args[1].value);
        let child = this.visit(node.args[2]);
        return new finc.FincTimeboundNode(child, begin, end);
      }

      case 'And': {
        let left  = this.visit(node.args[0]);
        let right = this.visit(node.args[1]);
        return new finc.FincAndNode(left, right);
      }

      case 'If': {
        let addr  = this.parseAddress(node);
        let left  = this.visit(node.args[1]);
        let right = this.visit(node.args[2]);
        return new finc.FincIfNode(left, right);
      }

      case 'Or': {
        let left  = this.visit(node.args[0]);
        let right = this.visit(node.args[1]);
        return new finc.FincOrNode(left, right);
      }

      case 'Give': {
        let child = this.visit(node.args[0]);
        return new finc.FincGiveNode(child);
      }

      case 'ScaleObs': {
        let addr  = this.parseAddress(node);
        let child = this.visit(node.args[1]);
        return new finc.FincScaleObsNode(child, [0, 0], addr);
      }

      case 'Scale': {
        let child = this.visit(node.args[1]);
        return new finc.FincScaleNode(child, node.args[0].value);
      }

      case 'One':
        return new finc.FincOneNode(parseInt(getCurrencyIndex(node.args[0].name)));

      case 'Zero':
        return new finc.FincZeroNode();

      default:
        vorpal.log('Error');
    }
  }

  parseAddress(node) {
    return '0x' + (node.args[0].value || node.args[0].args[1].name.slice(1))
  }
}