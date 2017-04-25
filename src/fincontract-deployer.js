import DescriptionDeployer from './fincontract-description-deployer';
import Sender from './tx-sender';

const log = require('minilog')('deploy');
require('minilog').enable();

export default class Deployer {

  constructor(marketplace, web3) {
    this.dd = new DescriptionDeployer(marketplace, web3);
    this.sender = new Sender(marketplace, web3);
    this.marketplace = marketplace;
  }

  deploy(description) {
    return this.dd.deployDescription(description)
      .then(descID => this.deployFincontract(descID));
  }

  issue(description, proposedOwner) {
    return this.deploy(description)
      .then(fctID => this.issueFincontract(fctID, proposedOwner));
  }

  issueFincontract(fctID, proposedOwner) {
    const args = [fctID, proposedOwner];
    return this.sender
      .send('issueFor', args)
      .watch({event: 'IssuedFor'}, logs => {
        const fctID = logs.args.fctId;
        const proposedOwner = logs.args.proposedOwner;
        log.info('Fincontract: ' + fctID);
        log.info('Issued for: ' + proposedOwner);
        return fctID;
      });
  }

  deployFincontract(descID) {
    return this.sender
      .send('createFincontract', [descID])
      .watch({event: 'CreatedBy'}, logs => {
        const fctID = logs.args.fctId;
        const owner = logs.args.user;
        log.info('Fincontract: ' + fctID);
        log.info('Created for: ' + owner);
        return fctID;
      });
  }
}
