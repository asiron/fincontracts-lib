const dd = require('./fincontract-description-deployer')
const sender = require('./tx-sender');

var log = require('minilog')('deploy');
require('minilog').enable();

export class Deployer {
  
  constructor(marketplace, web3) {
    this.dd = new dd.DescriptionDeployer(marketplace, web3);
    this.sender = new sender.Sender(marketplace, web3);
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
    return this.sender.send('issueFor', args, {event: 'IssuedFor'}, (logs) => {
      const fctID         = logs.args.fctId;
      const proposedOwner = logs.args.proposedOwner;
      log.info("Fincontract: " + fctID);
      log.info("Issued for: " + proposedOwner);
      return fctID;
    });
  }

  deployFincontract(descID) {
    return this.sender.send('createFincontract', [descID], {event: 'CreatedBy'}, (logs) => {
      const fctID = logs.args.fctId;
      const owner = logs.args.user;
      log.info("Fincontract: " + fctID);
      log.info("Created for: " + owner);
      return fctID;
    });
  }
}
