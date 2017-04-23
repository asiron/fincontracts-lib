import { GatewayInteger } from '../contracts/bin/gatewayint';
import { GatewayBool} from '../contracts/bin/gatewaybool';
import Sender from './tx-sender';

var log = require('minilog')('example');
require('minilog').enable();

export default class Examples {

  static get AllExamples() {
    return [
      'simpleTest', 
      'complexScaleObsTest', 
      'timeboundTest', 
      'setGateways',
      'resetGateways'
    ];
  }

  constructor(marketplace, web3) {
    this.marketplace = marketplace;
    this.web3 = web3;
  }

  runExample(name) {
    const noArgExamples = ['simpleTest', 'complexScaleObsTest'];
    if (noArgExamples.includes(name))
    {
      return this.deployExample(name, [0x0]);
    } 
    else if (name === 'timeboundTest')
    {
      const lowerBound = Math.round(Date.now() / 1000 + 120);
      const upperBound = Math.round(Date.now() / 1000 + 3600);
      return this.deployExample('timeboundTest', [0x0, lowerBound, upperBound]);
    } 
    else if (['setGateways','resetGateways'].includes(name)) 
    {
      const gatewayint  = (name === 'setGateways')
        ? GatewayInteger(this.web3).address : 0;
      
      const gatewaybool = (name === 'setGateways')
        ? GatewayBool(this.web3).address : 0;

      return this.setGateways(gatewayint, gatewaybool);
    } 
    else 
      return Promise.reject('Example does not exist!');
  }

  setGateways(gatewayint, gatewaybool) {
    const p1 = this.deploy('setGatewayI', [gatewayint],
      {filter: 'latest'}, logs => log.info('gatewayI set to ' + gatewayint));
    const p2 = this.deploy('setGatewayB', [gatewaybool],
      {filter: 'latest'}, logs => log.info('gatewayB set to ' + gatewaybool));
    return Promise.all([p1, p2]);
  }

  deployExample(name, args) {
    return this.deploy(name, args, {event: 'CreatedBy'}, (logs) => {
      const fctID = logs.args.fctId;
      const owner = logs.args.user;
      log.info('Fincontract: ' + fctID);
      log.info('Created for: ' + owner); 
      return fctID;
    });
  }

  deploy(name, args, event, block) {
    const s = new Sender(this.marketplace, this.web3);
    return s.send(name, args, event, block);
  }
}
