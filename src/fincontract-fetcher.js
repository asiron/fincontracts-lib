import * as finc from './fincontract';

export default class Fetcher {

  constructor(marketplace) {
    this.marketplace = marketplace;
  }

  static get Primitives() {
    return {
      0: {
        type: 'Zero',
        childrenCount: 0,
        builder: () => new finc.FincZeroNode()
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

  async pullFincontract(fctID) {
    const fctInfo = await this.getFincontractInfo(fctID);
    const desc = await this.pullDescription(fctInfo[3]);
    return new finc.Fincontract({
      id: fctID,
      issuer: fctInfo[0],
      owner: fctInfo[1],
      proposedOwner: fctInfo[2],
      rootDescription: desc
    });
  }

  async pullDescription(descID) {
    const descInfo = await this.getDescriptionInfo(descID);
    const primitive = Fetcher.Primitives[descInfo[0]];

    let childrenIds = descInfo.slice(2, 2 + primitive.childrenCount);
    childrenIds = childrenIds.map(id => this.pullDescription(id));
    childrenIds = await Promise.all(childrenIds);

    return await this.constructNode(descInfo, childrenIds);
  }

  constructNode(descInfo, childrenIds) {
    const primitive = Fetcher.Primitives[descInfo[0]];
    let currentNode = primitive.builder(descInfo, ...childrenIds);

    // If scale is present, then build node for it above the current one
    const scale = parseInt(descInfo[4], 10);
    currentNode = (scale === 1) ? currentNode :
      new finc.FincScaleNode(currentNode, scale);

    // If lowerBound is not 0, then most likely we have a timebound node
    const lowerBound = parseInt(descInfo[6], 10);
    const upperBound = parseInt(descInfo[7], 10);
    currentNode = (lowerBound === 0) ? currentNode :
      new finc.FincTimeboundNode(currentNode, lowerBound, upperBound);

    return currentNode;
  }

  getFincontractInfo(fctID) {
    return new Promise((resolve, reject) => {
      this.marketplace.getFincontractInfo(fctID, (err, fctInfo) => {
        if (err || !parseInt(fctInfo[0], 16)) {
          reject(Error('Contract was not found!'));
          return;
        }
        resolve(fctInfo);
      });
    });
  }

  getDescriptionInfo(descID) {
    return new Promise((resolve, reject) => {
      this.marketplace.getDescriptionInfo(descID, (err, descInfo) => {
        if (err || !descInfo.some(e => Boolean(parseInt(e, 16)))) {
          reject(Error('Description was empty!'));
          return;
        }
        resolve(descInfo);
      });
    });
  }

  // pullDescription(descID) {
  //   return new Promise((resolve, reject) => {
  //     this.marketplace.getDescriptionInfo(descID, (err, info) => {
  //       if (err || !info.some(e => Boolean(parseInt(e, 16)))) {
  //         reject(Error('Description was empty!'));
  //         return;
  //       }

  //       const primitive = Fetcher.Primitives[info[0]];

  //       let childrenIds = info.slice(2, 2 + primitive.childrenCount);
  //       childrenIds = childrenIds.map(id => this.pullDescription(id));
  //       childrenIds = Promise.all(childrenIds);
  //       childrenIds.then(ids => {
  //         let currentNode = primitive.builder(info, ...ids);

  //         // If scale is present, then build node for it above the current one
  //         const scale = parseInt(info[4], 10);
  //         currentNode = (scale === 1) ?
  //           currentNode :
  //           new finc.FincScaleNode(currentNode, scale);

  //         // If lowerBound is not 0, then most likely we have a timebound node
  //         const lowerBound = parseInt(info[6], 10);
  //         const upperBound = parseInt(info[7], 10);
  //         currentNode = (lowerBound === 0) ?
  //           currentNode :
  //           new finc.FincTimeboundNode(currentNode, lowerBound, upperBound);

  //         resolve(currentNode);
  //       });
  //     });
  //   });
  // }
}
