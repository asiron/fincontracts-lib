const math = require('mathjs');
const finc = require('./fincontract');
const parser = require('./fincontract-parser');

export class Fetcher {

  constructor(marketplace) {
    this.marketplace = marketplace;
  }

  static get Primitives() {
    return { 
      0: {
        type: 'Zero', 
        childrenCount: 0, 
        builder: (desc) => new finc.FincZeroNode() 
      },
      1: {
        type: 'One', 
        childrenCount: 0, 
        builder: (desc) => new finc.FincOneNode(desc[1])
      },
      2: { 
        type: 'Give',
        childrenCount: 1,
        builder: (desc, child) => new finc.FincGiveNode(child) 
      },
      3: {
        type: 'And',
        childrenCount: 2,
        builder: (desc, left, right) => new finc.FincAndNode(left, right)
      },
      4: {
        type: 'Or',
        childrenCount: 2,
        builder: (desc, left, right) => new finc.FincOrNode(left, right)
      },
      5: {
        type: 'ScaleObs',
        childrenCount: 1,
        builder: (desc, child) => new finc.FincScaleObsNode(child, desc[5])
      },
      6: {
        type: 'If',
        childrenCount: 2,
        builder: (desc, left, right) => new finc.FincIfNode(left, right, desc[5])
      }
    }
  }

  pullFincontract(fctID) {
    return new Promise((resolve, reject) => {
      const fctInfo = this.marketplace.getFincontractInfo(fctID);    
      if (!parseInt(fctInfo[0])) reject('Contract was not found!');
      const descID = this.pullDescription(fctInfo[3]);
      resolve(new finc.Fincontract(fctID, fctInfo[0], fctInfo[1], fctInfo[2], descID));
    });
  }

  pullDescription(descID) {
    const info = this.marketplace.getDescriptionInfo(descID);
    const primitive = Fetcher.Primitives[info[0]];
    let childrenIds = info.slice(2, 2 + primitive.childrenCount);
    childrenIds     = childrenIds.map(id => this.pullDescription(id));
    let currentNode = primitive.builder(info, ...childrenIds);

    // if scale is present, then build node for it above the current one
    const scale = info[4];
    currentNode = (scale != 1) 
      ? new finc.FincScaleNode(currentNode, scale) 
      : currentNode;
    
    // if lowerBound is not 0, then most likely we also have a timebound node
    const lowerBound = info[6];
    const upperBound = info[7];
    currentNode = (lowerBound != 0) 
      ? new finc.FincTimeboundNode(currentNode, lowerBound, upperBound) 
      : currentNode;

    return currentNode;
  }
}