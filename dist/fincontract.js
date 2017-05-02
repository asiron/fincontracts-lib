"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * {@link Fincontract} describes an instance of a Fincontract in memory.
 * It is usually fetched from the blockchain using
 * {@link Fetcher#pullFincontract}. Its description can be also constructed
 * using {@link Parser#parse}
 */
class Fincontract {

  /**
   * @param  {Object} kwargs
   * @param  {String} kwargs.id - 32-byte blockchain deployed ID
   * @param  {String} kwargs.owner - 32-byte address of an Ethereum account,
   *   who owns the Fincontract
   * @param  {String} kwargs.issuer - 32-byte address of an Ethereum account,
   *   who the Fincontract was issued for
   * @param  {String} kwargs.proposedOwner - 32-byte address of an Ethereum
   *   account, who is the proposed owner, an account that can join
   *   (see {@link Executor#join}) the Fincontract
   *  @param {FincNode} kwargs.rootDescription - root of the description tree
   */
  constructor(kwargs) {
    /**
     * 32-byte blockchain deployed ID
     * @type {String}
     */
    this.id = kwargs.id;
    /**
     * 32-byte address of an Ethereum account, who owns the Fincontract
     * @type {String}
     */
    this.owner = kwargs.owner;
    /**
     * 32-byte address of an Ethereum account, who the Fincontract
     * was issued for
     * @type {String}
     */
    this.issuer = kwargs.issuer;
    /**
     * 32-byte address of an Ethereum account, who is the proposed owner,
     * an account that can join (see {@link Executor#join}) the Fincontract
     * @type {String}
     */
    this.proposedOwner = kwargs.proposedOwner;
    /**
     * Root of the description tree
     * @type {FincNode}
     */
    this.rootDescription = kwargs.rootDescription;
  }
}

exports.Fincontract = Fincontract; /**
                                    * {@link FincNode} is the superclass for all primitives. It contains a list of
                                    * pointers to children. The number of children varies from `0` to `2` depending
                                    * on the inheriting node type.
                                    * <ul>
                                    *   <li> 2 children - {@link FincNode.children} is an {@link Array}
                                    *     of {@link FincNode} </li>
                                    *   <li> 1 child - {@link FincNode.children} is a {@link FincNode} </li>
                                    *   <li> no children - {@link FincNode.children} is {@link null} </li>
                                    * </ul>
                                    * @abstract
                                    */

class FincNode {

  /**
   * Constructs {@link FincNode} with an Array of children or a single child
   * reference
   * @param  {Array<FincNode>|FincNode|null} children - an Array of
   *   children or a single child reference
   */
  constructor(children) {
    /**
     * References to children, can be an {@link Array} of {@link FincNode},
     *   a {@link FincNode} or simply {@link null}.
     * @type {Array<FincNode>|FincNode|null}
     */
    this.children = children;
  }
}

exports.FincNode = FincNode; /**
                              * {@link FincTimeboundNode} extends {@link FincNode} and implements
                              * `Timebound` primitive, which takes a sub-fincontract and makes it valid only
                              * if the current timestamp is between {@link FincTimeboundNode.lowerBound} and
                              * {@link FincTimeboundNode.upperBound}.
                              * @extends {FincNode}
                              */

class FincTimeboundNode extends FincNode {

  /**
   * Constructs {@link FincTimeboundNode} with a child and two timestamps:
   * lowerBound (the beginning of Fincontract validity period) and upperBound
   * (the end of Fincontract validity period)
   *
   * @param  {FincNode} child - a sub-fincontract to be embedded inside
   *   {@link FincTimeboundNode}
   * @param  {Number} lowerBound - lower bound as Unix timestamp in seconds
   * @param  {Number} upperBound - upper bound as Unix timestamp in seconds
   */
  constructor(child, lowerBound, upperBound) {
    super(child);
    /**
     * Lower bound as Unix timestamp in seconds
     * @type {Number}
     */
    this.lowerBound = lowerBound;
    /**
     * Upper bound as Unix timestamp in seconds
     * @type {Number}
     */
    this.upperBound = upperBound;
  }
}

exports.FincTimeboundNode = FincTimeboundNode; /**
                                                * {@link FincAndNode} extends {@link FincNode} and implements
                                                * `And` primitive, which takes two sub-fincontracts and makes them both valid.
                                                * Meaning that the payer has to pay now both of them.
                                                * @extends {FincNode}
                                                */

class FincAndNode extends FincNode {

  /**
   * Constructs {@link FincAndNode} with two children
   * @param  {FincNode} leftChild  - first sub-fincontract to be embedded
   * @param  {FincNode} rightChild - second sub-fincontract to be embedded
   */
  constructor(leftChild, rightChild) {
    super([leftChild, rightChild]);
  }
}

exports.FincAndNode = FincAndNode; /**
                                    * {@link FincOrNode} extends {@link FincNode} and implements
                                    * `Or` primitive, which takes two sub-fincontracts and allows the owner to
                                    * choose only one of them. The other contract becomes invalid upon choice.
                                    * @extends {FincNode}
                                    */

class FincOrNode extends FincNode {

  /**
   * Constructs {@link FincOrNode} with two children
   * @param  {FincNode} leftChild  - first sub-fincontract to be embedded
   * @param  {FincNode} rightChild - second sub-fincontract to be embedded
   */
  constructor(leftChild, rightChild) {
    super([leftChild, rightChild]);
  }
}

exports.FincOrNode = FincOrNode; /**
                                  * {@link FincIfNode} extends {@link FincNode} and implements
                                  * `If` primitive, which takes two sub-fincontracts and a Gateway address.
                                  * Upon execution Gateway defines, which sub-fincontract is valid and which is
                                  * not. If Gateway returns `1` then the first sub-fincontract is chosen,
                                  * otherwise second sub-fincontract is chosen. Gateway has to conform to
                                  * the Gateway interface (see Gateway smart contract at
                                  * {@link FincontractMarketplace}).
                                  * @extends {FincNode}
                                  */

class FincIfNode extends FincNode {

  /**
   * Constructs {@link FincIfNode} with two children and a Gateway address
   * @param  {FincNode} leftChild  - first sub-fincontract to be embedded
   * @param  {FincNode} rightChild - second sub-fincontract to be embedded
   * @param  {String} gatewayAddress - 32-byte address of the blockchain
   *   deployed Gateway
   */
  constructor(leftChild, rightChild, gatewayAddress) {
    super([leftChild, rightChild]);
    /**
     * 32-byte address of the blockchain deployed Gateway
     * @type {String}
     */
    this.gatewayAddress = gatewayAddress;
  }
}

exports.FincIfNode = FincIfNode; /**
                                  * {@link FincScaleObsNode} extends {@link FincNode} and implements
                                  * `ScaleObs` primitive, which takes a sub-fincontract and a Gateway address.
                                  * Upon execution, the sub-fincontract is scaled by the value obtained from the
                                  * Gateway. Gateway has to conform to the Gateway interface
                                  * (see Gateway smart contract at {@link FincontractMarketplace}).
                                  * @extends {FincNode}
                                  */

class FincScaleObsNode extends FincNode {

  /**
   *
   * Constructs {@link FincScaleObsNode} with a child and a Gateway address.
   * @param  {FincNode} child - a sub-fincontract to be embedded inside
   *   {@link FincScaleObsNode}
   * @param  {String} gatewayAddress - 32-byte address of the blockchain
   *   deployed Gateway
   */
  constructor(child, gatewayAddress) {
    super(child);
    /**
     * 32-byte address of the blockchain deployed Gateway
     * @type {String}
     */
    this.gatewayAddress = gatewayAddress;
  }
}

exports.FincScaleObsNode = FincScaleObsNode; /**
                                              * {@link FincScaleNode} extends {@link FincNode} and implements
                                              * `Scale` primitive, which takes a sub-fincontract and a {@link Number}.
                                              * Upon execution, the sub-fincontract is scaled by the value of the
                                              * integer {@link FincScaleNode.scale}
                                              * @extends {FincNode}
                                              */

class FincScaleNode extends FincNode {

  /**
   * Constructs {@link FincScaleNode} with a child and an integer scale factor.
   * @param  {FincNode} child - a sub-fincontract to be embedded inside
   *   {@link FincScaleNode}
   * @param  {Number} scale - an integer scale factor
   */
  constructor(child, scale) {
    super(child);
    /**
     * Integer scale factor
     * @type {Number}
     */
    this.scale = scale;
  }
}

exports.FincScaleNode = FincScaleNode; /**
                                        * {@link FincOneNode} extends {@link FincNode} and implements
                                        * `One` primitive, which takes a currency index (see {@link CurrenciesType})
                                        * and always requires payer to pay `1` of that currency upon execution.
                                        * @extends {FincNode}
                                        */

class FincOneNode extends FincNode {

  /**
   * Constructs {@link FincOneNode} with a currency index
   * @param  {Number} currency - a currency index
   */
  constructor(currency) {
    super(null);
    /**
     * Currency index, must be one of the supported ones.
     * @type {Number}
     */
    this.currency = currency;
  }
}

exports.FincOneNode = FincOneNode; /**
                                    * {@link FincGiveNode} extends {@link FincNode} and implements
                                    * `Give` primitive, which upon execution flips the payer with the payee
                                    * @extends {FincNode}
                                    */

class FincGiveNode extends FincNode {}

exports.FincGiveNode = FincGiveNode; /**
                                      * {@link FincZeroNode} extends {@link FincNode} and implements
                                      * `Zero` primitive, which upon execution does nothing. There are no rights and
                                      * obligations.
                                      * @extends {FincNode}
                                      */

class FincZeroNode extends FincNode {

  /** Constructs {@link FincZeroNode} */
  constructor() {
    super(null);
  }
}
exports.FincZeroNode = FincZeroNode;