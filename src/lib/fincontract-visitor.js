import * as finc from './fincontract';

/**
 * {@link Visitor} implements pre-order tree traversal for Fincontract
 * description trees (see {@link FincNode}). This allows for subclassing to
 * achieve functionality like: serialization, evaluation and deployment.
 */
export class Visitor {

  /**
   * Visits current node.
   * Before calling the actual method that processes the
   * current node, it will visit all of its children and pass the results
   * to the function that processes the current node.
   * @param  {FincNode} node - currently being processed node
   * @return {Object} result from processing current node
   */
  visit(node) {
    switch (node.constructor) {

      case finc.FincAndNode: {
        const left = this.visit(node.children[0]);
        const right = this.visit(node.children[1]);
        return this.processAndNode(node, left, right);
      }

      case finc.FincIfNode: {
        const left = this.visit(node.children[0]);
        const right = this.visit(node.children[1]);
        return this.processIfNode(node, left, right);
      }

      case finc.FincOrNode: {
        const left = this.visit(node.children[0]);
        const right = this.visit(node.children[1]);
        return this.processOrNode(node, left, right);
      }

      case finc.FincTimeboundNode: {
        const child = this.visit(node.children);
        return this.processTimeboundNode(node, child);
      }

      case finc.FincGiveNode: {
        const child = this.visit(node.children);
        return this.processGiveNode(node, child);
      }

      case finc.FincScaleObsNode: {
        const child = this.visit(node.children);
        return this.processScaleObsNode(node, child);
      }

      case finc.FincScaleNode: {
        const child = this.visit(node.children);
        return this.processScaleNode(node, child);
      }

      case finc.FincOneNode:
        return this.processOneNode(node);

      case finc.FincZeroNode:
        return this.processZeroNode();

      default:
        return this.processUnknownNode();

    }
  }

  /**
   * Called when processing {@link FincAndNode}.
   * @abstract
   * @return {Object} result of processing {@link FincAndNode}
   */
  processAndNode() {
    throw new Error('FincAndNode: must be implemented by subclass!');
  }

  /**
   * Called when processing {@link FincIfNode}.
   * @abstract
   * @return {Object} result of processing {@link FincIfNode}
   */
  processIfNode() {
    throw new Error('FincIfNode: must be implemented by subclass!');
  }

  /**
   * Called when processing {@link FincOrNode}.
   * @abstract
   * @return {Object} result of processing {@link FincOrNode}
   */
  processOrNode() {
    throw new Error('FincOrNode: must be implemented by subclass!');
  }

  /**
   * Called when processing {@link FincTimeboundNode}.
   * @abstract
   * @return {Object} result of processing {@link FincTimeboundNode}
   */
  processTimeboundNode() {
    throw new Error('FincTimeboundNode: must be implemented by subclass!');
  }

  /**
   * Called when processing {@link FincScaleObsNode}.
   * @abstract
   * @return {Object} result of processing {@link FincScaleObsNode}
   */
  processScaleObsNode() {
    throw new Error('FincScaleObsNode: must be implemented by subclass!');
  }

  /**
   * Called when processing {@link FincScaleNode}.
   * @abstract
   * @return {Object} result of processing {@link FincScaleNode}
   */
  processScaleNode() {
    throw new Error('FincScaleNode: must be implemented by subclass!');
  }

  /**
   * Called when processing {@link FincGiveNode}.
   * @abstract
   * @return {Object} result of processing {@link FincGiveNode}
   */
  processGiveNode() {
    throw new Error('FincGiveNode: must be implemented by subclass!');
  }

  /**
   * Called when processing {@link FincOneNode}.
   * @abstract
   * @return {Object} result of processing {@link FincOneNode}
   */
  processOneNode() {
    throw new Error('FincOneNode: must be implemented by subclass!');
  }

  /**
   * Called when processing {@link FincZeroNode}.
   * @abstract
   * @return {Object} result of processing {@link FincZeroNode}
   */
  processZeroNode() {
    throw new Error('FincZeroNode: must be implemented by subclass!');
  }
}

/**
 * {@link CollectingVisitor} extends {@link Visitor} by providing default
 * functionality of collecting all leaf nodes. By default leaf-nodes return
 * an empty list, so the result is an empty list as well. An example of usage
 * is the {@link GatewayVisitor} which collects all Gateways from the tree.
 * @extends {Visitor}
 */
export class CollectingVisitor extends Visitor {

  /**
   * Called during preorder traversal when processing {@link FincAndNode}.
   * Returns a list that concatenates the results from processing both left
   * and right subtrees
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {Object} left an Object containing result of
   *   processing left child (first subtree) of the current node
   * @param  {Object} right an Object containing result of
   *   processing right child (second subtree) of the current node
   * @return {Array} an Array that contains the concatenated results from
   *   processing both left and right subtrees
   */
  processAndNode(node, left, right) {
    return [...left, ...right];
  }

  /**
   * Called during preorder traversal when processing {@link FincIfNode}.
   * Returns a list that concatenates the results from processing both left
   * and right subtrees
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {Object} left an Object containing result of
   *   processing left child (first subtree) of the current node
   * @param  {Object} right an Object containing result of
   *   processing right child (second subtree) of the current node
   * @return {Array} an Array that contains the concatenated results from
   *   processing both left and right subtrees
   */
  processIfNode(node, left, right) {
    return [...left, ...right];
  }

  /**
   * Called during preorder traversal when processing {@link FincOrNode}.
   * Returns a list that concatenates the results from processing both left
   * and right subtrees
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {Object} left an Object containing result of
   *   processing left child (first subtree) of the current node
   * @param  {Object} right an Object containing result of
   *   processing right child (second subtree) of the current node
   * @return {Array} an Array that contains the concatenated results from
   *   processing both left and right subtrees
   */
  processOrNode(node, left, right) {
    return [...left, ...right];
  }

  /**
   * Called during preorder traversal when processing {@link FincTimeboundNode}.
   * Passes the result from child to parent.
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {Object} child an Object containing result of
   *   processing the only child (its subtree) of the current node

   * @return {Object} returns the result of processing the only child
   */
  processTimeboundNode(node, child) {
    return child;
  }

  /**
   * Called during preorder traversal when processing {@link FincScaleObsNode}.
   * Passes the result from child to parent.
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {Object} child an Object containing result of
   *   processing the only child (its subtree) of the current node

   * @return {Object} returns the result of processing the only child
   */
  processScaleObsNode(node, child) {
    return child;
  }

  /**
   * Called during preorder traversal when processing {@link FincScaleNode}.
   * Passes the result from child to parent.
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {Object} child an Object containing result of
   *   processing the only child (its subtree) of the current node

   * @return {Object} returns the result of processing the only child
   */
  processScaleNode(node, child) {
    return child;
  }

  /**
   * Called during preorder traversal when processing {@link FincGiveNode}.
   * Passes the result from child to parent.
   * @override
   * @param  {FincNode} node currently processed node
   * @param  {Object} child an Object containing result of
   *   processing the only child (its subtree) of the current node

   * @return {Object} returns the result of processing the only child
   */
  processGiveNode(node, child) {
    return child;
  }

  /**
   * Called during preorder traversal when processing {@link FincOneNode}.
   * Returns an empty list.
   * @override
   * @return {Array} an empty list
   */
  processOneNode() {
    return [];
  }

  /**
   * Called during preorder traversal when processing {@link FincZeroNode}.
   * Returns an empty list.
   * @override
   * @return {Array} an empty list
   */
  processZeroNode() {
    return [];
  }
}

/**
 * {@link EmptyVisitor} extends {@link Visitor}. All functions return nulls.
 * It's useful for implementing things like checking if there exists a path from
 * root to nearest OR node while only passing through `Scale` and `Timebound`
 * nodes. This is something that has to be check, before sending `executeOr`
 * transaction.
 */
export class EmptyVisitor extends Visitor {

  /**
   * Called during preorder traversal when processing {@link FincAndNode}.
   * @override
   * @return {null}
   */
  processAndNode() {}

  /**
   * Called during preorder traversal when processing {@link FincIfNode}.
   * @override
   * @return {null}
   */
  processIfNode() {}

  /**
   * Called during preorder traversal when processing {@link FincOrNode}.
   * @override
   * @return {null}
   */
  processOrNode() {}

  /**
   * Called during preorder traversal when processing {@link FincTimeboundNode}.
   * @override
   * @return {null}
   */
  processTimeboundNode() {}

  /**
   * Called during preorder traversal when processing {@link FincScaleObsNode}.
   * @override
   * @return {null}
   */
  processScaleObsNode() {}

  /**
   * Called during preorder traversal when processing {@link FincScaleNode}.
   * @override
   * @return {null}
   */
  processScaleNode() {}

  /**
   * Called during preorder traversal when processing {@link FincGiveNode}.
   * @override
   * @return {null}
   */
  processGiveNode() {}

  /**
   * Called during preorder traversal when processing {@link FincOneNode}.
   * @override
   * @return {null}
   */
  processOneNode() {}

  /**
   * Called during preorder traversal when processing {@link FincZeroNode}.
   * @override
   * @return {null}
   */
  processZeroNode() {}
}
