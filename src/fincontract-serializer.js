import {Visitor} from './fincontract-visitor';
import {Currencies} from './currency';

const compressZero = addr => parseInt(addr, 16) ? addr : '0x0';

class SerializerVisitor extends Visitor {

  processAndNode(node, left, right) {
    return 'And(' + left + ',' + right + ')';
  }

  processIfNode(node, left, right) {
    return 'If(' + compressZero(node.gatewayAddress) + ',' +
      left + ',' + right + ')';
  }

  processOrNode(node, left, right) {
    return 'Or(' + left + ',' + right + ')';
  }

  processTimeboundNode(node, child) {
    return 'Timebound(' + node.lowerBound + ',' +
      node.upperBound + ',' + child + ')';
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

  processZeroNode() {
    return 'Zero()';
  }

  processUnknownNode() {
    throw new Error('Unknown case during serialization!');
  }

}

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
