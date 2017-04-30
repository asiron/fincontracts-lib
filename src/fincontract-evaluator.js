import {Gateway} from '../contracts/bin/gateway';
import {Visitor} from './fincontract-visitor';
import Currency from './currency';
import GatewayUpdater from './fincontract-gateway-updater';

const makeArray = (size, obj) => Array.apply(null, Array(size)).map(() => obj);
const flatten = arr => arr.reduce((a, b) => a.concat(b));
const cross = (arr1, arr2) => arr1.map(a => arr2.map(b => [a, b]));
const zip = (a1, a2) => a1.map((x, i) => [x, a2[i]]);
const tupleMUL = i => i[0] * i[1];

/**
 * NodeEvaluators is an Object that contains evaluator functions for all
 * types of nodes (See classes that inherit from {@link FincNode}). Each key
 * contains a function that has to return the actual evaluator function. This is
 * because certain evaluations require node's context and certain do not.
 * The actual evaluator function has to take one argument, that is
 * one interval or a tuple of two intervals. It has to always return a single
 * interval.
 *
 * @typedef {Object} NodeEvaluators
 * @property {Callback} if - Evaluates {@link FincIfNode} nodes
 * @property {Callback} or - Evaluates {@link FincOrNode} nodes
 * @property {Callback} and - Evaluates {@link FincIfNode} nodes
 * @property {Callback} give - Evaluates {@link FincGiveNode} nodes
 * @property {Callback} scale - Evaluates {@link FincScaleNode} nodes
 * @property {Callback} scaleObs - Evaluates {@link FincScaleObsNode} nodes
 * @property {Callback} timebound - Evaluates {@link FincIfNode} nodes
 * @property {Callback} zero - Evaluates {@link FincZeroNode} nodes
 * @property {Callback} one - Evaluates {@link FincOneNode} nodes
 */

/**
 * Returns {@link NodeEvaluators} object for evaluating using `estimate` method.
 * Nodes are defined as:
 * <ul>
 *  <li>`if`  : interval arithmetic union</li>
 *  <li>`or`  : interval arithmetic union</li>
 *  <li>`an`d : interval arithmetic addition</li>
 *  <li>`give`  : interval arithmetic negation</li>
 *  <li>`scale`  : interval arithmetic scalar mulitplication with scale</li>
 *  <li>`scaleObs`  : interval arithmetic multiplication with estimate scale interval</li>
 *  <li>`timebound`  : zero interval if fincontract's upper bound has passed</li>
 *  <li>`one`  : interval arithmetic 1</li>
 *  <li>`zero`  : interval arithmetic 0</li>
 * </ul>
 * @return {NodeEvaluators} node evaluators object describing `estimate`
 * evaluation method
 */
export function makeEstimationEvaluators() {
  return ({
    if: () => ([iA, iB]) => [Math.min(iA[0], iB[0]), Math.max(iA[1], iB[1])],
    or: () => ([iA, iB]) => [Math.min(iA[0], iB[0]), Math.max(iA[1], iB[1])],
    and: () => ([iA, iB]) => [iA[0] + iB[0], iA[1] + iB[1]],
    give: () => i => [-i[1], -i[0]],
    scale: node => i => [i[0] * node.scale, i[1] * node.scale],
    scaleObs: node => i => {
      // Throw in the futures if range is not defined!
      const range = node.range || [1, 1.2];
      const a = flatten(cross(range, i)).map(tupleMUL);
      return [Math.min(...a), Math.max(...a)];
    },
    timebound: node => i => {
      return (node.upperBound < Math.round(Date.now() / 1000)) ? [0, 0] : i;
    },
    zero: () => () => makeArray(Currency.CurrencyCount, [0, 0]),
    one: node => () => {
      const arr = makeArray(Currency.CurrencyCount, [0, 0]);
      arr[node.currency] = [1, 1];
      return arr;
    }
  });
}

/**
 * Returns {@link NodeEvaluators} object for evaluating using `direct`
 * (See {@link makeEstimationEvaluators}) method.
 * Nodes are defined exactly as for `estimate` method with exceptions of:
 * <ul>
 *  <li>`if` : selects the child interval based on the boolean
 *    value obtained from calling the gateway</li>
 *  <li>`scaleObs`  : interval arithmetic scalar multiplication
 *    with scale obtained from calling the gateway</li>
 * </ul>
 * @param {Web3} web3 a web3 instance connected to Ethereum node
 * @return {NodeEvaluators} node evaluators object describing `direct`
 * evaluation method
 */
export function makeDirectEvaluators(web3) {
  const gateway = Gateway(web3);
  const evaluator = makeEstimationEvaluators();
  evaluator.if = node => ([iA, iB]) => {
    const bool = gateway.at(node.gatewayAddress).getValue.call();
    return bool ? iA : iB;
  };
  evaluator.scaleObs = node => i => {
    const scale = gateway.at(node.gatewayAddress).getValue.call();
    return [i[0] * scale, i[1] * scale];
  };
  return evaluator;
}

/**
 * Performs the actual evaluation of a {@link Fincontract} by analysing its
 * description tree (See {@link FincNode}). Traverses the tree in preorder
 * fashion and applies node evaluator functions at each node, returning the
 * result to the parent node. The choice of node evaluator functions defines
 * the evaluation method.
 * @extends {Visitor}
 */
export class EvaluatorVisitor extends Visitor {

  /**
   * Constructs the {@link EvaluatorVisitor} object with evaluator functions
   * @extends {Visitor}
   * @param {NodeEvaluators} nodeEvaluators an object with evaluator functions
   */
  constructor(nodeEvaluators) {
    super();
    /** @type {NodeEvaluator} */
    this.nodeEvaluators = nodeEvaluators;
  }

  /**
   * Called during preorder traversal when processing {@link FincAndNode}.
   * Evaluates the current node using `NodeEvaluators.and`
   * (See {@link NodeEvaluators}) evaluator function by mapping over all currencies.
   * @override
   * @param  {FincNode} node node currently being processed
   * @param  {Array} left an array of intervals resulted from processing
   *   left child (first subtree) of the current node
   * @param  {Array} right an array of intervals resulted from processing
   *   right child (second subtree) of the current node
   * @return {Array} an Array of intervals, where each element is an interval for a
   * given currency indexed by {@link Currency.Currencies}
   */
  processAndNode(node, left, right) {
    return zip(left, right).map(this.nodeEvaluators.and(node));
  }

  /**
   * Called during preorder traversal when processing {@link FincIfNode}.
   * Evaluates the current node using `NodeEvaluators.if`
   * (See {@link NodeEvaluators}) evaluator function by mapping over all currencies.
   * @override
   * @param  {FincNode} node node currently being processed
   * @param  {Array} left an array of intervals resulted from processing
   *   left child (first subtree) of the current node
   * @param  {Array} right an array of intervals resulted from processing
   *   right child (second subtree) of the current node
   * @return {Array} an Array of intervals, where each element is an interval for a
   * given currency indexed by {@link Currency.Currencies}
   */
  processIfNode(node, left, right) {
    return zip(left, right).map(this.nodeEvaluators.if(node));
  }

  /**
   * Called during preorder traversal when processing {@link FincOrNode}.
   * Evaluates the current node using `NodeEvaluators.or`
   * (See {@link NodeEvaluators}) evaluator function by mapping over all currencies.
   * @override
   * @param  {FincNode} node node currently being processed
   * @param  {Array} left an array of intervals resulted from processing
   *   left child (first subtree) of the current node
   * @param  {Array} right an array of intervals resulted from processing
   *   right child (second subtree) of the current node
   * @return {Array} an Array of intervals, where each element is an interval for a
   * given currency indexed by {@link Currency.Currencies}
   */
  processOrNode(node, left, right) {
    return zip(left, right).map(this.nodeEvaluators.or(node));
  }

  /**
   * Called during preorder traversal when processing {@link FincTimeboundNode}.
   * Evaluates the current node using `NodeEvaluators.timebound`
   * (See {@link NodeEvaluators}) evaluator function by mapping over all currencies.
   * @override
   * @param  {FincNode} node node currently being processed
   * @param  {Array} child an Array of intervals resulted from processisng
   *   the only child (its subtree) of the current node
   * @return {Array} an Array of intervals, where each element is an interval for a
   * given currency indexed by {@link Currency.Currencies}
   */
  processTimeboundNode(node, child) {
    return child.map(this.nodeEvaluators.timebound(node));
  }

  /**
   * Called during preorder traversal when processing {@link FincGiveNode}.
   * Evaluates the current node using `NodeEvaluators.give`
   * (See {@link NodeEvaluators}) evaluator function by mapping over all currencies.
   * @override
   * @param  {FincNode} node node currently being processed
   * @param  {Array} child an Array of intervals resulted from processisng
   *   the only child (its subtree) of the current node
   * @return {Array} an Array of intervals, where each element is an interval for a
   * given currency indexed by {@link Currency.Currencies}
   */
  processGiveNode(node, child) {
    return child.map(this.nodeEvaluators.give(node));
  }

  /**
   * Called during preorder traversal when processing {@link FincScaleObsNode}.
   * Evaluates the current node using `NodeEvaluators.scaleObs`
   * (See {@link NodeEvaluators}) evaluator function by mapping over all currencies.
   * @override
   * @param  {FincNode} node node currently being processed
   * @param  {Array} child an Array of intervals resulted from processisng
   *   the only child (its subtree) of the current node
   * @return {Array} an Array of intervals, where each element is an interval for a
   * given currency indexed by {@link Currency.Currencies}
   */
  processScaleObsNode(node, child) {
    return child.map(this.nodeEvaluators.scaleObs(node));
  }

  /**
   * Called during preorder traversal when processing {@link FincScaleNode}.
   * Evaluates the current node using `NodeEvaluators.scale`
   * (See {@link NodeEvaluators}) evaluator function by mapping over all currencies.
   * @override
   * @param  {FincNode} node node currently being processed
   * @param  {Array} child an Array of intervals resulted from processisng
   *   the only child (its subtree) of the current node
   * @return {Array} an Array of intervals, where each element is an interval for a
   * given currency indexed by {@link Currency.Currencies}
   */
  processScaleNode(node, child) {
    return child.map(this.nodeEvaluators.scale(node));
  }

  /**
   * Called during preorder traversal when processing {@link FincOneNode}.
   * Evaluates the current node using `NodeEvaluators.one`
   * (See {@link NodeEvaluators}) evaluator function by mapping over all currencies.
   * @override
   * @param  {FincNode} node node currently being processed
   * @return {Array} an Array of intervals, where each element is an interval for a
   * given currency indexed by {@link Currency.Currencies}
   */
  processOneNode(node) {
    return this.nodeEvaluators.one(node).call();
  }

  /**
   * Called during preorder traversal when processing {@link FincZeroNode}.
   * Evaluates the current node using `NodeEvaluators.zero`
   * (See {@link NodeEvaluators}) evaluator function by mapping over all currencies.
   * @override
   * @param  {FincNode} node node currently being processed
   * @return {Array} an Array of intervals, where each element is an interval for a
   * given currency indexed by {@link Currency.Currencies}
   */
  processZeroNode(node) {
    return this.nodeEvaluators.zero(node).call();
  }

  /**
   * Called during preorder traversal when processing an unknown node
   * @override
   * @throws {Error} always
   */
  processUnknownNode() {
    throw new Error('Unknown case during evaluation');
  }
}

/**
 * Evaluator class is used for performing different evaluation methods on a
 * Fincontracts' descriptions.
 * @example
 * import Fetcher from './fincontract-fetcher';
 * import Evaluator from './fincontract-evaluator';
 * import Currency from './currency';
 * const f = new Fetcher(marketplace);
 * const e = new Evaluator(web3);
 * const method = 'estimate';
 * const id = '<32 byte address of a deployed Fincontract>';
 * try {
 *   const fincontract = await f.pullFincontract(id);
 *   const evaluated   = await e.evaluate(fincontract.rootDescription, {method});
 *   const currencies  = Currency.convertToJSON(evaluated);
 *   const exchanged   = await Currency.changeAllCurrencies('USD', currencies);
 *   console.log(JSON.stringify(evaluated));
 *   console.log(JSON.stringify(exchanged));
 * } catch (err) {
 *   console.log(error(err));
 * }
 */
export default class Evaluator {

  /**
   * Constructs the {@link Evaluator} object with a web3 instance
   * @param {Web3} web3 a web3 instance connected to Ethereum node
   */
  constructor(web3) {
    /** @private */
    this.web3 = web3;
  }

  /**
   * Evaluates a description of {@link Fincontract}, actual evaluation is
   * delegated to {@link EvaluatorVisitor}. This method implements two options:
   * `direct` and `estimate` evaluation. `direct` updates Gateways in
   * all {@link FincScaleObsNode} and {@link FincIfNode} nodes before
   * performing evaluation. It then later calls these Gateways to
   * get the latest values. On the other hand
   * `estimate` evaluation needs an interval for {@link FincScaleObsNode} and
   * {@link FincIfNode} nodes are treated like {@link FincOrNode}, by assuming that
   * both sub-fincontracts are equally likely.
   *
   * @param  {FincNode} description root of {@link FincNode} tree for evaluation
   * @param  {Object} options
   * @param  {String} options.method Method for evaluating the description tree
   * @return {Promise} resolves promise if evaluation succeeded
   * with {Array} of currency intervals or rejects with Error if it failed
   */
  async evaluate(description, options) {
    if (options.method === 'direct') {
      const evaluators = makeDirectEvaluators(this.web3);
      const ev = new EvaluatorVisitor(evaluators);
      const gu = new GatewayUpdater(this.web3);
      await gu.updateAllGateways(description);
      return Promise.resolve(ev.visit(description));
    } else if (options.method === 'estimate') {
      const evaluators = makeEstimationEvaluators();
      const ev = new EvaluatorVisitor(evaluators);
      return Promise.resolve(ev.visit(description));
    }
    return Promise.reject(Error('Wrong evaluation method'));
  }
}
