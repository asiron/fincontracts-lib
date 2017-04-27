import {Gateway} from '../contracts/bin/gateway';
import {CollectingVisitor} from './fincontract-visitor';
import Sender from './tx-sender';

const log = require('minilog')('gateway-updater');
require('minilog').enable();

class GatewayVisitor extends CollectingVisitor {

  constructor(web3) {
    super();
    this.web3 = web3;
  }

  updateGateway(address, type) {
    if (!parseInt(address, 16)) {
      throw new Error(`Gateway's address was 0x0`);
    }
    const gateway = Gateway(this.web3).at(address);
    return new Sender(gateway, this.web3)
      .send('update', [])
      .watch({block: 'latest'}, () => {
        log.info('Finished updating ' + type + ' gateway at: ' + address);
      });
  }

  processIfNode(node, left, right) {
    const self = this.updateGateway(node.gatewayAddress, 'If');
    return [...left, ...right, self];
  }

  processScaleObsNode(node, child) {
    const self = this.updateGateway(node.gatewayAddress, 'ScaleObs');
    return [...child, self];
  }
}

export default class GatewayUpdater {

  constructor(web3) {
    this.gv = new GatewayVisitor(web3);
  }

  updateAllGateways(node) {
    return Promise.all(this.gv.visit(node));
  }
}
