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
    return this.sender
      .send(name, args)
      .watch({event: 'PrimitiveStoredAt'}, logs => {
        const primitiveId = logs.args.id;
        log.info(name + ' primitive ID: ' + primitiveId);
        return primitiveId;
      });
  }

  async processAndNode(node, left, right) {
    const children = await Promise.all([left, right]);
    return this.deployPrimitive('And', children);
  }

  async processIfNode(node, left, right) {
    const children = await Promise.all([left, right]);
    const args = [node.gatewayAddress].concat(children);
    return this.deployPrimitive('If', args);
  }

  async processOrNode(node, left, right) {
    const children = await Promise.all([left, right]);
    return this.deployPrimitive('Or', children);
  }

  async processTimeboundNode(node, child) {
    const args = [node.lowerBound, node.upperBound, await child];
    return this.deployPrimitive('Timebound', args);
  }

  async processGiveNode(node, child) {
    return this.deployPrimitive('Give', [await child]);
  }

  async processScaleObsNode(node, child) {
    const args = [node.gatewayAddress, await child];
    return this.deployPrimitive('ScaleObs', args);
  }

  async processScaleNode(node, child) {
    const args = [node.scale, await child];
    return this.deployPrimitive('Scale', args);
  }

  async processOneNode(node) {
    return this.deployPrimitive('One', [node.currency]);
  }

  async processZeroNode() {
    return this.deployPrimitive('Zero', []);
  }

  processUnknownNode() {
    throw new Error('Unknown case during description deployment!');
  }
}
