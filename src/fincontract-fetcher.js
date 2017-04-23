import * as finc from './fincontract';

// Const log = require('minilog')('fetcher');
// require('minilog').enable();

export default class Fetcher {

  constructor(marketplace) {
    this.marketplace = marketplace;
  }

  static get Primitives() {
    return {
      0: {
        type: 'Zero',
        childrenCount: 0,
        builder: desc => new finc.FincZeroNode()
      },
      1: {
        type: 'One',
        childrenCount: 0,
        builder: desc => new finc.FincOneNode(parseInt(desc[1], 10))
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
    };
  }

  pullFincontract(fctID) {
    const that = this;
    const getInfo = new Promise((resolve, reject) => {
      that.marketplace.getFincontractInfo(fctID, (err, fctInfo) => {
        if (err || !parseInt(fctInfo[0], 16)) {
          reject(Error('Contract was not found!'));
        }
        resolve(fctInfo);
      });
    });
    const getDesc = getInfo.then(fctInfo => that.pullDescription(fctInfo[3]));
    return Promise.all([getInfo, getDesc]).then(([fctInfo, desc]) =>
      new finc.Fincontract(fctID, fctInfo[0], fctInfo[1], fctInfo[2], desc)
    );
  }

  pullDescription(descID) {
    return new Promise((resolve, reject) => {
      this.marketplace.getDescriptionInfo(descID, (err, info) => {
        if (err || !info.some(e => Boolean(parseInt(e, 16)))) {
          reject(Error('Description was empty!'));
        }

        const primitive = Fetcher.Primitives[info[0]];

        let childrenIds = info.slice(2, 2 + primitive.childrenCount);
        childrenIds = childrenIds.map(id => this.pullDescription(id));
        childrenIds = Promise.all(childrenIds);
        childrenIds.then(ids => {
          let currentNode = primitive.builder(info, ...ids);

          // If scale is present, then build node for it above the current one
          const scale = parseInt(info[4], 10);
          currentNode = (scale === 1) ?
            currentNode :
            new finc.FincScaleNode(currentNode, scale);

          // If lowerBound is not 0, then most likely we have a timebound node
          const lowerBound = parseInt(info[6], 10);
          const upperBound = parseInt(info[7], 10);
          currentNode = (lowerBound === 0) ?
            currentNode :
            new finc.FincTimeboundNode(currentNode, lowerBound, upperBound);

          resolve(currentNode);
        });
      });
    });
  }
}
