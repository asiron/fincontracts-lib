import * as finc from './fincontract';

export class Visitor {

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

  processAndNode() {
    throw new Error('must be implemented by subclass!');
  }
  processIfNode() {
    throw new Error('must be implemented by subclass!');
  }

  processOrNode() {
    throw new Error('must be implemented by subclass!');
  }
  
  processTimeboundNode() {
    throw new Error('must be implemented by subclass!');
  }
  
  processScaleObsNode() {
    throw new Error('must be implemented by subclass!');
  }
  
  processScaleNode() {
    throw new Error('must be implemented by subclass!');
  }
  
  processGiveNode() {
    throw new Error('must be implemented by subclass!');
  }
  
  processOneNode() {
    throw new Error('must be implemented by subclass!');
  }
  
  processZeroNode() {
    throw new Error('must be implemented by subclass!');
  }
}

export class CollectingVisitor extends Visitor {

  processAndNode(node, left, right) {
    return left.concat(right);
  }
  processIfNode(node, left, right) {
    return left.concat(right);
  }
  processOrNode(node, left, right) {
    return left.concat(right);
  }
  processTimeboundNode(node, child) {
    return child;
  }
  processScaleObsNode(node, child) {
    return child;
  }
  processScaleNode(node, child) {
    return child;
  }
  processGiveNode(node, child) {
    return child;
  }
  processOneNode() {
    return [];
  }
  processZeroNode() {
    return [];
  }  
}

export class EmptyVisitor extends Visitor {

  processAndNode() {}
  processIfNode() {}
  processOrNode() {}
  processTimeboundNode() {}
  processScaleObsNode() {}
  processScaleNode() {}
  processGiveNode() {}
  processOneNode() {}
  processZeroNode() {}
}
