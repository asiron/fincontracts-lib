'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fincontract = require('./fincontract');

var finc = _interopRequireWildcard(_fincontract);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * Fetcher class is used for fetching blockchain deployed Fincontracts, by
 * calling appropriate functions (see `getFincontractInfo` and
 * `getDescriptionInfo` from {@link FincontractMarketplace}). It recursively
 * traverses the deployed Fincontract and constructs it's copy for further
 * processing in memory.
 */
class Fetcher {

  /**
   * Constructs the {@link Fetcher} object with Fincontracts smart contract
   * instance
   * @param {FincontractMarketplace} marketplace a Fincontracts smart contract instance
   */
  constructor(marketplace) {
    /** @private */
    this.marketplace = marketplace;
  }

  /** @private */
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

  /**
   * Fetches Fincontract from blockchain given its 32-byte address, by
   * recursively fetching nodes and it's children and constructing the
   * {@link FincNode} description tree (see {@link Fetcher#pullDescription})
   * @param  {String} fctID - 32-byte address of a blockchain deployed Fincontract
   * @return {Fincontract} fetched Fincontract instance
   */
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

  /**
   * Performs a recursive description fetch, given a root 32-byte address of the
   * blockchain deployed Fincontract description
   * @param  {String} descID - 32-byte address of a blockchain deployed
   *   Fincontract's description
   * @return {FincNode} fetched FincNode description tree
   */
  async pullDescription(descID) {
    const descInfo = await this.getDescriptionInfo(descID);
    const primitive = Fetcher.Primitives[descInfo[0]];

    let childrenIds = descInfo.slice(2, 2 + primitive.childrenCount);
    childrenIds = childrenIds.map(id => this.pullDescription(id));
    childrenIds = await Promise.all(childrenIds);

    return this.constructNode(descInfo, childrenIds);
  }

  /**
   * Constructs a current {@link FincNode} given it's description, which
   * uniquely specifies the type of node to be constructed as well as its
   * already constructed sub-nodes (childrenIds) and returns the currentNode.
   * Due to lack of direct support for Timebound and Scale nodes by
   * {@link FincontractMarketplace}, they are inferred from the description.
   * <ul>
   *   <li>{@link FincScaleNode} - Scale node is constructed if description
   *   contains scale factor not equal to 1</li>
   *   <li>{@link FincTimeboundNode} - Timebound node is constructed if
   *   description contains lower bound not equal to 0</li>
   * </ul>
   * In both cases, nodes are constructed above the current node and the
   * top node is returned from the function
   * @param  {Array} descInfo - array containing description, as defined by
   *   `getDescriptionInfo` from {@link FincontractMarketplace}
   * @param  {Array} childrenIds - array containing {@link FincNode} children of
   *   the current node
   * @return {FincNode} - newly constructed node
   */
  constructNode(descInfo, childrenIds) {
    const primitive = Fetcher.Primitives[descInfo[0]];
    let currentNode = primitive.builder(descInfo, ...childrenIds);

    // If scale is present, then build node for it above the current one
    const scale = parseInt(descInfo[4], 10);
    currentNode = scale === 1 ? currentNode : new finc.FincScaleNode(currentNode, scale);

    // If lowerBound is not 0, then most likely we have a timebound node
    const lowerBound = parseInt(descInfo[6], 10);
    const upperBound = parseInt(descInfo[7], 10);
    currentNode = lowerBound === 0 ? currentNode : new finc.FincTimeboundNode(currentNode, lowerBound, upperBound);

    return currentNode;
  }

  /**
   * Fetches the blockchain deployed Fincontract info given its 32-byte address.
   * Returns a promise, that resolves to the Fincontract info as defined
   * by `getFincontractInfo` function in {@link FincontractMarketplace} or
   * rejects with an Error if the Fincontract was not found.
   * @param  {String} fctID - 32-byte address of the blockchain deployed
   *   Fincontract
   * @return {Promise<String,Error>} - promise, that resolves with the info
   *   or rejects with an Error if the Fincontract was not found.
   */
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

  /**
   * Fetches the blockchain deployed Fincontract description given
   * its 32-byte address. Returns a promise, that resolves to the Fincontract
   * description as defined by `getDescriptionInfo` function
   * in {@link FincontractMarketplace} or rejects with an Error if the whole
   * description was empty.
   * @param  {String} descID - 32-byte address of the blockchain deployed
   *   Fincontract description
   * @return {Promise<String,Error>} - promise, that resolves with the
   *   description or rejects with an Error if the description was empty.
   */
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

}
exports.default = Fetcher;