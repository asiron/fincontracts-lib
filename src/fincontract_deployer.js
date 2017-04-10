const finc = require('./fincontract');

const GAS = 4000000;

export class Deployer {
  
  constructor(marketplace) {
    this.marketplace = marketplace;
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
    var that = this;
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
        return Promise.all([left, right]).then(ids => {
          return that.deployPrimitive('And', ids);
        });
      }

      case finc.FincOrNode: {
        const left  = this.visit(node.children[0]);
        const right = this.visit(node.children[1]);
        return Promise.all([left, right]).then(ids => {
          return that.deployPrimitive('Or', ids);
        });
      }

      case finc.FincTimeboundNode:
        return this.visit(node.children).then(primitiveId => {
          const args = [node.lowerBound, node.upperBound, primitiveId];
          return that.deployPrimitive('Timebound', args);
        });

      case finc.FincGiveNode:   
        return this.visit(node.children).then(primitiveId => {
          return that.deployPrimitive('Give', [primitiveId]);
        });

      case finc.FincScaleObservableNode:   
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

      default:
        console.log('Error, Default case.');
    }
  }

  issueFincontract(fctID, proposedOwner) {
    const args = [fctID, proposedOwner];
    return this.sendTransaction('issueFor', args, 'IssuedFor', (logs) => {
      const fctID         = res.args.fctId;
      const proposedOwner = res.args.proposedOwner;
      console.log("Fincontract: " + fctID + "\nIssued for: " + proposedOwner);
      return fctID;
    });
  }

  deployFincontract(descID) {
    return this.sendTransaction('createFincontract', [descID], 'CreatedBy', (logs) => {
      const fctID = logs.args.fctId;
      const owner = logs.args.user;
      console.log("Fincontract: " + fctID + "\nCreated for: " + owner);
      return fctID;
    });
  }

  deployPrimitive(name, args) {
    return this.sendTransaction(name, args, 'PrimitiveStoredAt', (logs) => {
      const primitiveId = logs.args.id;
      console.log('Primitive Id: ' + primitiveId);
      return primitiveId;
    });
  }

  sendTransaction(name, args, event, block) {
    const that = this;
    return new Promise((resolve, reject) => {
      that.marketplace[name].sendTransaction(...args, {gas: GAS}, (err, tx) => {
        if (!err) {
          console.log(name + ' transaction was sent. HASH: ' + tx);
          that.watch(event, block)(tx, resolve, reject);
        } else {
          reject(Error('Error at transaction ' + name + ' with args ' + args));
        }
      });
    });
  }

  watch(event, block) {
    const that = this;
    return (tx, resolve, reject) => {
      const listener = that.marketplace[event]({fromBlock : 'latest', toBlock : 'pending'});
      listener.watch((err, logs) => {
        if (err) {
          reject(Error('Error during event ' + event + ' : ' + err));
          return;
        }
        if (logs.transactionHash == tx) {
          listener.stopWatching();
          const yielded = block(logs);
          resolve(yielded);
        }
      });
    }
  }

}