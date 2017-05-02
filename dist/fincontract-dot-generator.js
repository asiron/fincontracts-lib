'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DotGeneratorVisitor = exports.makeRandomIDFunc = undefined;

var _fincontractVisitor = require('./fincontract-visitor');

var _currency = require('./currency');

var _currency2 = _interopRequireDefault(_currency);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const compressZero = addr => parseInt(addr, 16) ? addr : '0x0';
const formatDate = date => {
  return new Date(date * 1000).toLocaleString('en-GB', { hour12: false });
};

const makeLabel = fincontract => `
\t\tnode [style=filled, fillcolor="lightgrey", color="darkgreen"];
\t\tcolor=purple;
\t\tlabel = <
\t\t\t<table border="0" cellborder="1" cellspacing="0" cellpadding="4">
\t\t\t\t<tr >
\t\t\t\t\t<td colspan="2"><b>Fincontract</b></td>
\t\t\t\t</tr>
\t\t\t\t<tr>
\t\t\t\t\t<td align="center">ID:</td>
\t\t\t\t\t<td align="center">${compressZero(fincontract.id)}</td>
\t\t\t\t</tr>
\t\t\t\t<tr>
\t\t\t\t\t<td align="center">Owner:</td>
\t\t\t\t\t<td align="center">${compressZero(fincontract.owner)}</td>
\t\t\t\t</tr>
\t\t\t\t<tr>
\t\t\t\t\t<td align="center">Issuer:</td>
\t\t\t\t\t<td align="center">${compressZero(fincontract.issuer)}</td>
\t\t\t\t</tr>
\t\t\t\t<tr>
\t\t\t\t\t<td align="center">Proposed Owner:</td>
\t\t\t\t\t<td align="center">${compressZero(fincontract.proposedOwner)}</td>
\t\t\t\t</tr>
\t\t\t</table>
\t\t>`;

function expandGraphDescription(previous, id, label) {
  const { arcs, labels, last } = previous;
  const newArc = `${id} -> ${last}`;
  const newLabels = Object.assign({}, labels, { [id]: label });

  return { arcs: [...arcs, newArc], labels: newLabels, last: id };
}

function joinGraphDescriptions(left, right) {
  const labels = Object.assign({}, left.labels, right.labels);
  return { arcs: [...left.arcs, ...right.arcs], labels, last: left.last };
}

/**
 * Creates a random ID generator given a PRNG
 * @param  {Function} randomFunc a PRNG to be used as source of randomness
 * @return {Function} returns a random ID generator function
 */
const makeRandomIDFunc = exports.makeRandomIDFunc = randomFunc => () => Math.floor(randomFunc() * Number.MAX_SAFE_INTEGER);

/**
 * {@link DotGeneratorVisitor} performs collection of links and labels
 * in order to later generate a DOT description of the Fincontract graph
 * from {@link FincNode} description tree by extending {@link Visitor}.
 * @extends {Visitor}
 */
class DotGeneratorVisitor extends _fincontractVisitor.Visitor {

  /**
   * Called during preorder traversal when processing {@link FincAndNode}.
   * Adds current links to all the children to the intermediate set of links
   * and labels returned by children.
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {Object} left an Object containing intermediate result of
   *   collecting links and labels form left child (first subtree)
   *   of the current node
   * @param  {Object} right an Object containing intermediate result of
   *   collecting links and labels form right child (second subtree)
   *   of the current node
   * @return {Object} an Object containing combined results from
   *   the children and the current node
   */
  processAndNode(node, left, right) {
    const id = `and_${this.randomID()}`;
    const label = `AND`;
    const l = expandGraphDescription(left, id, label);
    const r = expandGraphDescription(right, id, label);
    return joinGraphDescriptions(l, r);
  }

  /**
   * Called during preorder traversal when processing {@link FincIfNode}.
   * Adds current links to all the children to the intermediate set of links
   * and labels returned by children.
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {Object} left an Object containing intermediate result of
   *   collecting links and labels form left child (first subtree)
   *   of the current node
   * @param  {Object} right an Object containing intermediate result of
   *   collecting links and labels form right child (second subtree)
   *   of the current node
   * @return {Object} an Object containing combined results from
   *   the children and the current node
   */
  processIfNode(node, left, right) {
    const id = `if_${this.randomID()}`;
    const label = `IF ${compressZero(node.gatewayAddress)}`;
    const l = expandGraphDescription(left, id, label);
    const r = expandGraphDescription(right, id, label);
    return joinGraphDescriptions(l, r);
  }

  /**
   * Called during preorder traversal when processing {@link FincOrNode}.
   * Adds current links to all the children to the intermediate set of links
   * and labels returned by children.
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {Object} left an Object containing intermediate result of
   *   collecting links and labels form left child (first subtree)
   *   of the current node
   * @param  {Object} right an Object containing intermediate result of
   *   collecting links and labels form right child (second subtree)
   *   of the current node
   * @return {Object} an Object containing combined results from
   *   the children and the current node
   */
  processOrNode(node, left, right) {
    const id = `or_${this.randomID()}`;
    const label = `OR`;
    const l = expandGraphDescription(left, id, label);
    const r = expandGraphDescription(right, id, label);
    return joinGraphDescriptions(l, r);
  }

  /**
   * Called during preorder traversal when processing {@link FincTimeboundNode}.
   * Adds current links to all the children to the intermediate set of links
   * and labels returned by the only child.
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {Object} child an Object containing intermediate result of
   *   collecting links and labels form its only child (subtree)
   * @return {Object} an Object containing combined results from
   *   the child and the current node
   */
  processTimeboundNode(node, child) {
    const id = `timebound_${this.randomID()}`;
    const begin = formatDate(node.lowerBound);
    const end = formatDate(node.upperBound);
    const label = `TIMEBOUND\\n${begin}\\n${end}`;
    return expandGraphDescription(child, id, label);
  }

  /**
   * Called during preorder traversal when processing {@link FincGiveNode}.
   * Adds current links to all the children to the intermediate set of links
   * and labels returned by the only child.
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {Object} child an Object containing intermediate result of
   *   collecting links and labels form its only child (subtree)
   * @return {Object} an Object containing combined results from
   *   the child and the current node
   */
  processGiveNode(node, child) {
    const id = `give_${this.randomID()}`;
    const label = `GIVE`;
    return expandGraphDescription(child, id, label);
  }

  /**
   * Called during preorder traversal when processing {@link FincScaleObsNode}.
   * Adds current links to all the children to the intermediate set of links
   * and labels returned by the only child.
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {Object} child an Object containing intermediate result of
   *   collecting links and labels form its only child (subtree)
   * @return {Object} an Object containing combined results from
   *   the child and the current node
   */
  processScaleObsNode(node, child) {
    const id = `scaleobs_${this.randomID()}`;
    const label = `SCALEOBS ${compressZero(node.gatewayAddress)}`;
    return expandGraphDescription(child, id, label);
  }

  /**
   * Called during preorder traversal when processing {@link FincScaleNode}.
   * Adds current links to all the children to the intermediate set of links
   * and labels returned by the only child.
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {Object} child an Object containing intermediate result of
   *   collecting links and labels form its only child (subtree)
   * @return {Object} an Object containing combined results from
   *   the child and the current node
   */
  processScaleNode(node, child) {
    const id = `scale_${this.randomID()}`;
    const label = `SCALE ${node.scale}`;
    return expandGraphDescription(child, id, label);
  }

  /**
   * Called during preorder traversal when processing {@link FincOneNode}.
   * As {@link FincOneNode} is a leaf node, therefore this functions just
   * returns an empty object with a single label (this node).
   * @override
   * @param  {FincNode} node currently processed node
   * @return {Object} an Object containing a single label (this node)
   */
  processOneNode(node) {
    const id = `one_${this.randomID()}`;
    const currency = _currency2.default.Currencies[node.currency];
    return { arcs: [], labels: { [id]: `ONE ${currency}` }, last: id };
  }

  /**
   * Called during preorder traversal when processing {@link FincZeroNode}.
   * As {@link FincZeroNode} is a leaf node, therefore this functions just
   * returns an empty object with a single label (this node).
   * @override
   * @return {Object} an Object containing a single label (this node)
   */
  processZeroNode() {
    const id = `zero_${this.randomID()}`;
    return { arcs: [], labels: { [id]: `ZERO` }, last: id };
  }

  /**
   * Called during preorder traversal when processing an unknown node.
   * Throws an error.
   * @override
   * @throws {Error} always
   */
  processUnknownNode() {
    throw new Error('Unknown case during graph generation!');
  }

}

exports.DotGeneratorVisitor = DotGeneratorVisitor; /**
                                                    * {@link DotGenerator} class allows for generation Fincontract DOT graphs. It
                                                    * delegates the generation of the description tree graph ({@link FincNode} tree)
                                                    * to {@link DotGeneratorVisitor} and generates the rest of the graph
                                                    * (bounding box and HTML labels). For more details on DOT language see:
                                                    * {@link http://www.graphviz.org}.
                                                   
                                                    * @example
                                                    * import DotGenerator from './fincontract-dot-generator';
                                                    * const fincontract = ...;
                                                    * const dg = new DotGenerator();
                                                    * const graph = dg.generate(fincontract);
                                                    * ... pipe it into a DOT engine ...
                                                    */

class DotGenerator {

  /**
   * Constructs {@link DotGenerator} object.
   */
  constructor() {
    /** @private */
    this.dgv = new DotGeneratorVisitor();
    this.dgv.randomID = makeRandomIDFunc(Math.random);
  }

  /**
   * Generates {@link Fincontract} graph description in DOT language given
   * a Fincontract. This can be later piped into any DOT engine
   * that supports HTML labels.
   * @param  {Fincontract} fincontract a Fincontract to be visualized
   * @return {String} a string describing the graph in DOT language
   */
  generate(fincontract) {
    const graph = this.dgv.visit(fincontract.rootDescription);
    let output = `digraph G {\n`;
    output += `\tsubgraph cluster_fincontract {\n`;
    output += makeLabel(fincontract);
    output += graph.arcs.reduce((links, link) => `${links}\n\t\t${link};`, '');
    output += Object.keys(graph.labels).reduce((labels, id) => `${labels}\n\t\t${id} [label="${graph.labels[id]}"];`, '');
    output += `\n\t}\n`;
    output += `}\n`;
    return output;
  }
}
exports.default = DotGenerator;