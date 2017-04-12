const finc = require('./fincontract');
const curr = require('./currency');

const compressZero = (addr) => parseInt(addr) ? addr : '0x0'

export class Serializer {
  
  constructor() {}

  serialize(fincontract) {
    return {
      id: compressZero(fincontract.id),
      owner: compressZero(fincontract.owner), 
      issuer: compressZero(fincontract.issuer), 
      proposedOwner: compressZero(fincontract.proposedOwner),
      description: this.visit(fincontract.rootDescription)
    };
  }

  visit(node) {

    switch (node.constructor) {
      
      case finc.FincTimeboundNode:
        return 'Timebound(' + node.lowerBound + ',' 
          + node.upperBound + ',' + this.visit(node.children) + ')';

      case finc.FincAndNode:
        return 'And(' + this.visit(node.children[0]) + ','
          + this.visit(node.children[1]) + ')';

      case finc.FincIfNode:
        return 'If(' + compressZero(node.gatewayAddress) + ',' 
          + this.visit(node.children[0]) + ',' 
          + this.visit(node.children[1]) + ')';

      case finc.FincOrNode:
        return 'Or(' + this.visit(node.children[0]) + ','
          + this.visit(node.children[1]) + ')';

      case finc.FincGiveNode:
        return 'Give(' + this.visit(node.children) + ')';

      case finc.FincScaleObsNode:
        return 'ScaleObs(' + compressZero(node.gatewayAddress) + ',' 
          + this.visit(node.children) + ')';

      case finc.FincScaleNode:
        return 'Scale(' + node.scale + ',' 
          + this.visit(node.children) + ')';

      case finc.FincOneNode:
        return 'One(' + curr.Currencies[node.currency] + ')'

      case finc.FincZeroNode:
        return 'Zero()'

      default: throw('Error: Unknown case during serialization');

    }
  }
}