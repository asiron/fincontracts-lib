const math = require('mathjs');
const finc = require('./fincontract');
const parser = require('./fincontract_parser');

export class FincontractFactory {

  constructor(marketplace) {
    this.marketplace = marketplace;
  }

  static get DEFAULT_GATEWAY() { return [1, 1.2]; }

  static get PRIMITIVES() {
    return [
      { 
        childCount: 0, 
        builder: (desc) => 
          new finc.FincZeroNode() 
      },
      { 
        childCount: 0, 
        builder: (desc) =>
          new finc.FincOneNode(desc[1])
      },
      { 
        childCount: 1, 
        builder: (desc, child) => 
          new finc.FincGiveNode(child) 
      },
      { 
        childCount: 2, 
        builder: (desc, lChild, rChild) =>
          new finc.FincAndNode(lChild, rChild)
      },
      { 
        childCount: 2, 
        builder: (desc, lChild, rChild) => 
          new finc.FincOrNode(lChild, rChild) 
      },
      { 
        childCount: 1, 
        builder: (desc, child) => 
          new finc.FincScaleObsNode(child, FincontractFactory.DEFAULT_GATEWAY, desc[5])
      },
      { 
        childCount: 2, 
        builder: (desc, lChild, rChild) => 
          new finc.FincIfNode(lChild, rChild, desc[5])
      }
    ];
  }

  pullFincontract(fctId) {
    let fctInfo = this.marketplace.getFincontractInfo(fctId);    
    if (!parseInt(fctInfo[0])) return null;
    let rootDescription = this.pullDescription(fctInfo[3]);
    return new finc.Fincontract(fctId, fctInfo[0], fctInfo[1], fctInfo[2], rootDescription)
  }

  pullDescription(descId) {
    let desc = this.marketplace.getDescriptionInfo(descId);
    let primitive   = FincontractFactory.PRIMITIVES[desc[0]];
    let childrenIds = desc.slice(2, 2+primitive.childCount);
    childrenIds     = childrenIds.map((id) => this.pullDescription(id));
    let currentNode = primitive.builder(desc, ...childrenIds);

    // if scale is present, then build node for it above the current one
    let scale = desc[4];
    currentNode = (scale != 1) ? new finc.FincScaleNode(currentNode, scale) : currentNode;
    
    // if lowerBound is not 0, then most likely we also have a timebound node
    let lowerBound = desc[6], upperBound = desc[7];
    currentNode = (lowerBound != 0) ? new finc.FincTimebound(currentNode, lowerBound, upperBound) : currentNode;

    return currentNode;
  }
}