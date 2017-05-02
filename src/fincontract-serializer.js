import {Visitor} from './fincontract-visitor';
import Currency from './currency';

const compressZero = addr => parseInt(addr, 16) ? addr : '0x0';

/**
 * {@link SerializerVisitor} performs the actual serialization of
 * a {@link FincNode} description tree into String by extending {@link Visitor}.
 * @extends {Visitor}
 */
export class SerializerVisitor extends Visitor {

  /**
   * Called during preorder traversal when processing {@link FincAndNode}.
   * Serializes current node with its already serialized children.
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {String} left a String containing result of
   *   serializing left child (first subtree) of the current node
   * @param  {String} right a String containing result of
   *   serializing right child (second subtree) of the current node
   * @return {String} a String that serializes the current node and all of its
   *   subtrees
   */
  processAndNode(node, left, right) {
    return `And(${left},${right})`;
  }

  /**
   * Called during preorder traversal when processing {@link FincIfNode}.
   * Serializes current node with its already serialized children. Gateway's
   * address is compressed if it's a zero address to `0x0`.
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {String} left a String containing result of
   *   serializing left child (first subtree) of the current node
   * @param  {String} right a String containing result of
   *   serializing right child (second subtree) of the current node
   * @return {String} a String that serializes the current node and all of its
   *   subtrees
   */
  processIfNode(node, left, right) {
    return `If(${compressZero(node.gatewayAddress)},${left},${right})`;
  }

  /**
   * Called during preorder traversal when processing {@link FincOrNode}.
   * Serializes current node with its already serialized children.
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {String} left a String containing result of
   *   serializing left child (first subtree) of the current node
   * @param  {String} right a String containing result of
   *   serializing right child (second subtree) of the current node
   * @return {String} a String that serializes the current node and all of its
   *   subtrees
   */
  processOrNode(node, left, right) {
    return `Or(${left},${right})`;
  }

  /**
   * Called during preorder traversal when processing {@link FincTimeboundNode}.
   * Serializes current node with its already serialized children.
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {String} child a String containing result of
   *   serializing its only child (its subtree) of the current node
   * @return {String} a String that serializes the current node and its subtree
   */
  processTimeboundNode(node, child) {
    return `Timebound(${node.lowerBound},${node.upperBound},${child})`;
  }

  /**
   * Called during preorder traversal when processing {@link FincGiveNode}.
   * Serializes current node with its already serialized children.
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {String} child a String containing result of
   *   serializing its only child (its subtree) of the current node
   * @return {String} a String that serializes the current node and its subtree
   */
  processGiveNode(node, child) {
    return `Give(${child})`;
  }

  /**
   * Called during preorder traversal when processing {@link FincScaleObsNode}.
   * Serializes current node with its already serialized children. Gateway's
   * address is compressed if it's a zero address to `0x0`.
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {String} child a String containing result of
   *   serializing its only child (its subtree) of the current node
   * @return {String} a String that serializes the current node and its subtree
   */
  processScaleObsNode(node, child) {
    return `ScaleObs(${compressZero(node.gatewayAddress)},${child})`;
  }

  /**
   * Called during preorder traversal when processing {@link FincScaleNode}.
   * Serializes current node with its already serialized children.
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {String} child a String containing result of
   *   serializing its only child (its subtree) of the current node
   * @return {String} a String that serializes the current node and its subtree
   */
  processScaleNode(node, child) {
    return `Scale(${node.scale},${child})`;
  }

  /**
   * Called during preorder traversal when processing {@link FincOneNode}.
   * Serializes current node.
   * @override
   * @param  {FincNode} node currently processed node
   * @return {String} a String that serializes the current node.
   */
  processOneNode(node) {
    return `One(${Currency.Currencies[node.currency]})`;
  }

  /**
   * Called during preorder traversal when processing {@link FincZeroNode}.
   * Serializes current node.
   * @override
   * @return {String} a String that serializes the current node.
   */
  processZeroNode() {
    return `Zero()`;
  }

  /**
   * Called during preorder traversal when processing an unknown node.
   * Throws an error.
   * @override
   * @throws {Error} always
   */
  processUnknownNode() {
    throw new Error('Unknown case during serialization!');
  }

}

/**
 * {@link Serializer} class allows for serialization of Fincontracts. It
 * delegates the serialization of the description tree ({@link FincNode} tree)
 * to {@link SerializerVisitor} and serializes the rest of the properties.
 * @example
 * import Serializer from './fincontract-serializer';
 * const fincontract = ...;
 * const srz = new Serializer();
 * const serialized = srz.serialize(fincontract);
 * console.log(JSON.stringify(serialized));
 */
export default class Serializer {

  /**
   * Constructs {@link Serializer} object.
   */
  constructor() {
    /** @private */
    this.sv = new SerializerVisitor();
  }

  /**
   * Serializes a {@link Fincontract} to a plain-old Java Script
   * object that can be easily converted to JSON, by calling `JSON.stringify`.
   * All address are compressed, meaning a zero address is compressed to `0x0`
   * @param  {Fincontract} fincontract a Fincontract instance
   * @return {Object} the serialized object
   */
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
