import * as finc from "./fincontract";

export default class FincontractFactory {

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
          new finc.FincScaleObservableNode(child, FincontractFactory.DEFAULT_GATEWAY)
      },
      { 
        childCount: 2, 
        builder: (desc, lChild, rChild) => 
          new finc.FincIfNode(lChild, rChild)
      }
    ];
  }

  pullContract(fctId) {
    let fctInfo = this.marketplace.getFincontractInfo(fctId);    
    let rootDescription = this.pullDescription(fctInfo[3]);
    return new finc.Fincontract(fctInfo[0], fctInfo[1], fctInfo[2], rootDescription)
  }

  pullDescription(descId) {
    let desc = this.marketplace.getDescriptionInfo(descId);
    let primitive   = FincontractFactory.PRIMITIVES[desc[0]];
    let childrenIds = desc.slice(2, 2+primitive.childCount);
    childrenIds     = childrenIds.map((id) => this.pullDescription(id));
    let currentNode = primitive.builder(desc, ...childrenIds);

    // if scale is present, then build node for it above the current one
    let scale = desc[4];
    return (scale != 1) ? new finc.FincScaleNode(currentNode, scale) : currentNode;
  }
}