const gatewayintjs = require('../contracts/bin/gatewayint.js');
const gatewaybooljs = require('../contracts/bin/gatewaybool.js');

const sender = require('./tx-sender');
var log = require('minilog')('example');
require('minilog').enable();

export const AllExamples = [
  'simpleTest', 
  'complexScaleObsTest', 
  'timeboundTest', 
  'gateways'
];

export class Examples {

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
    else if (name == 'timeboundTest')
    {
      const lowerBound = Math.round(Date.now() / 1000 + 120);
      const upperBound = Math.round(Date.now() / 1000 + 3600);
      return this.deployExample('timeboundTest', [0x0, lowerBound, upperBound]);
    } 
    else if (name == 'gateways') 
    {
      const gatewayint  = gatewayintjs.GatewayInteger(this.web3);
      const gatewaybool = gatewaybooljs.GatewayBool(this.web3);
      const p1 = this.deploy('setGatewayI', [gatewayint.address],
        {filter: 'latest'}, logs => log.info('gatewayI set to GatewayInt'));
      const p2 = this.deploy('setGatewayB', [gatewaybool.address],
        {filter: 'latest'}, logs => log.info('gatewayB set to GatewayBool'));
      return Promise.all([p1, p2]);
    } 
    else 
      return Promise.reject('Example does not exist!');
  }

  deployExample(name, args) {
    return this.deploy(name, args, {event: 'CreatedBy'}, (logs) => {
      const fctID = logs.args.fctId;
      const owner = logs.args.user;
      log.info("Fincontract: " + fctID);
      log.info("Created for: " + owner); 
      return fctID;
    });
  }

  deploy(name, args, event, block) {
    const s = new sender.Sender(this.marketplace, this.web3);
    return s.send(name, args, event, block);
  }
}
