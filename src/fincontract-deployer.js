const finc = require('./fincontract');
const sender = require('./tx-sender');
var log = require('minilog')('deploy');
require('minilog').enable();

export class Deployer {
  
  constructor(marketplace, web3) {
    this.sender = new sender.Sender(marketplace, web3);
    this.marketplace = marketplace;
    this.web3 = web3;
  }

  deploy(description) {
    return this.visit(description)
      .then(descID => this.deployFincontract(descID));
  }

  issue(description, proposedOwner) {
    return this.deploy(description)
      .then(fctID => this.issueFincontract(fctID, proposedOwner));
  }

  visit(node) {
    const that = this;
    switch (node.constructor) {

      case finc.FincIfNode: {
        const left  = this.visit(node.children[0]);
        const right = this.visit(node.children[1]);
        return Promise.all([left, right]).then(ids => {
          const args = [node.gatewayAddress].concat(ids);
          return that.deployPrimitive('If', args);
        });
      }

      case finc.FincAndNode: {
        const left  = this.visit(node.children[0]);
        const right = this.visit(node.children[1]);
        return Promise.all([left, right]).then(ids =>
          that.deployPrimitive('And', ids)
        );
      }

      case finc.FincOrNode: {
        const left  = this.visit(node.children[0]);
        const right = this.visit(node.children[1]);
        return Promise.all([left, right]).then(ids =>
          that.deployPrimitive('Or', ids)
        );
      }

      case finc.FincTimeboundNode:
        return this.visit(node.children).then(primitiveId => {
          const args = [node.lowerBound, node.upperBound, primitiveId];
          return that.deployPrimitive('Timebound', args);
        });

      case finc.FincGiveNode:   
        return this.visit(node.children).then(primitiveId =>
          that.deployPrimitive('Give', [primitiveId])
        );

      case finc.FincScaleObsNode:   
        return this.visit(node.children).then(primitiveId => {
          const args = [node.gatewayAddress, primitiveId];
          return that.deployPrimitive('ScaleObs', args);
        });

      case finc.FincScaleNode:
        return this.visit(node.children).then(primitiveId => {
          const args = [node.scale, primitiveId];
          return that.deployPrimitive('Scale', args);
        });

      case finc.FincOneNode:
        return this.deployPrimitive('One', [node.currency]);

      case finc.FincZeroNode:
        return this.deployPrimitive('Zero', []);

      default: throw('Error: Unknown case during primitive deployment');
    }
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

  deployPrimitive(name, args) {
    return this.sender.send(name, args, {event: 'PrimitiveStoredAt'}, (logs) => {
      const primitiveId = logs.args.id;
      log.info(name + ' primitive ID: ' + primitiveId);
      return primitiveId;
    });
  }
}
