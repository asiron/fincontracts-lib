import { Visitor } from './fincontract-visitor';
import { Currencies } from './currency';

const compressZero = (addr) => parseInt(addr) ? addr : '0x0'

export default class Serializer {
  
  constructor() {
    this.sv = new SerializerVisitor();
  }

  serialize(fincontract) {
    return {
      id: compressZero(fincontract.id),
      owner: compressZero(fincontract.owner), 
      issuer: compressZero(fincontract.issuer), 
      proposedOwner: compressZero(fincontract.proposedOwner),
      description: this.sv.visit(fincontract.rootDescription)
    };
  }
}

class SerializerVisitor extends Visitor {

  constructor() { super(); }

  processAndNode(node, left, right) {
    return 'And(' + left + ',' + right + ')';
  }

  processIfNode(node, left, right) {
    return 'If(' + compressZero(node.gatewayAddress) + ',' 
      + left + ',' + right + ')';
  }
   
  processOrNode(node, left, right) {
    return 'Or(' + left + ',' + right + ')';
  }

  processTimeboundNode(node, child) {
    return 'Timebound(' + node.lowerBound + ',' 
      + node.upperBound + ',' + child + ')';
  } 

  processGiveNode(node, child) {
    return 'Give(' + child + ')';
  }

  processScaleObsNode(node, child) {
    return 'ScaleObs(' + compressZero(node.gatewayAddress) + ',' + child + ')';
  }

  processScaleNode(node, child) {
    return 'Scale(' + node.scale + ',' + child + ')';
  }

  processOneNode(node) {
    return 'One(' + Currencies[node.currency] + ')';
  }

  processZeroNode(node) {
    return 'Zero()';
  }

  processUnknownNode(node) {
    throw('Error: Unknown case during serialization!');
  }

}