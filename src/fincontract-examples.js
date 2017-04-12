const sender = require('./tx-sender');

export class Examples {

  constructor(marketplace, web3) {
    this.marketplace = marketplace;
    this.web3 = web3;
  }

  runExample(index) {
    switch (index) {
      case 1: return this.deployExampleFincontract('simpleTest', [0x0]);
      case 2: return this.deployExampleFincontract('complexScaleObsTest', [0x0]);
      case 3: {
        const lowerBound = Math.round(Date.now() / 1000 + 120);
        const upperBound = Math.round(Date.now() / 1000 + 3600);
        return this.deployExampleFincontract('timeboundTest', [0x0, lowerBound, upperBound]);
      }
      default: return Promise.reject('Example does not exist!');
    }
  }

  deployExampleFincontract(name, args) {
    const s = new sender.Sender(this.marketplace, this.web3);
    return s.send(name, args, {event: 'CreatedBy'}, logs => logs.args);

    //   const fctID = logs.args.fctId;
    //   const owner = logs.args.user;
    //   vorpal.log(chalk.blue("Fincontract: " + fctID + "\nCreated for: " + owner)); 
    //   return [fctID;
    // });
  };
}
