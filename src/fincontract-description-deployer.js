import Sender from './tx-sender';
import {Visitor} from './fincontract-visitor';

const log = require('minilog')('desc-deploy');
require('minilog').enable();

export default class DescriptionDeployer extends Visitor {

  constructor(marketplace, web3) {
    super();
    this.marketplace = marketplace;
    this.sender = new Sender(marketplace, web3);
  }

  deployDescription(node) {
    return this.visit(node);
  }

  deployPrimitive(name, args) {
    return this.sender.send(name, args, {event: 'PrimitiveStoredAt'}, logs => {
      const primitiveId = logs.args.id;
      log.info(name + ' primitive ID: ' + primitiveId);
      return primitiveId;
    });
  }

  processAndNode(node, left, right) {
    const that = this;
    return Promise.all([left, right])
      .then(ids => that.deployPrimitive('And', ids));
  }

  processIfNode(node, left, right) {
    const that = this;
    return Promise.all([left, right]).then(ids => {
      const args = [node.gatewayAddress].concat(ids);
      return that.deployPrimitive('If', args);
    });
  }

  processOrNode(node, left, right) {
    const that = this;
    return Promise.all([left, right])
      .then(ids => that.deployPrimitive('Or', ids));
  }

  processTimeboundNode(node, child) {
    const that = this;
    return child.then(primitiveId => {
      const args = [node.lowerBound, node.upperBound, primitiveId];
      return that.deployPrimitive('Timebound', args);
    });
  }

  processGiveNode(node, child) {
    const that = this;
    return child.then(primitiveId => that.deployPrimitive('Give', [primitiveId]));
  }

  processScaleObsNode(node, child) {
    const that = this;
    return child.then(primitiveId => {
      const args = [node.gatewayAddress, primitiveId];
      return that.deployPrimitive('ScaleObs', args);
    });
  }

  processScaleNode(node, child) {
    const that = this;
    return child.then(primitiveId => {
      const args = [node.scale, primitiveId];
      return that.deployPrimitive('Scale', args);
    });
  }

  processOneNode(node) {
    return this.deployPrimitive('One', [node.currency]);
  }

  processZeroNode() {
    return this.deployPrimitive('Zero', []);
  }

  processUnknownNode() {
    throw new Error('Unknown case during description deployment!');
  }
}
