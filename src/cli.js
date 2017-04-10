#!/usr/bin/env node --harmony
const vorpal  = require('vorpal')();
const chalk   = require('chalk');
const figures = require('figures');
const logSymbols = require('log-symbols');
const BigNumber  = require('bignumber.js');

const error  = msg => chalk.bold.red(figures.cross + " " + msg);
const ok     = msg => chalk.green(figures.tick + " " + msg);
const warn   = msg => chalk.yellow(logSymbols.warning + "  " + msg);
const info   = msg => chalk.blue(logSymbols.info + " " + msg);

var Web3 = require('web3');
var web3 = new Web3();

const marketplacejs = require('../contracts/bin/marketplace.js'), marketplace = null;
const fincFactory   = require("./fincontract_factory");
const evaluator     = require("./fincontract_evaluator");
const serializer    = require("./fincontract_serializer");
const parser        = require('./fincontract_parser');
const deployer      = require('./fincontract_deployer');

/* setting up local storage hook */
vorpal.localStorage('fincontract-client');
var storage = require('./storage');
storage = new storage.Storage(vorpal.localStorage);

const parseAddress = (str) => {
  const id = parseBigNum(str) || '0'
  return '0x' + zfill(id.toString(16),64)
}
const zfill = (num, len) => (Array(len).join("0") + num).slice(-len)
const parseBigNum = (str) => {
  try {
    return new BigNumber(str);
  } catch (e) {
    vorpal.log(error("Not a number!"));
  }
}
const isNodeConnected = _ => web3.isConnected() || error("Node is not connected");
const connectToEthereumNode = (host) => {
  const url = 'http://' + host;
  const provider = new web3.providers.HttpProvider(url);
  web3.setProvider(provider);  
  if (isNodeConnected() == true) {
    marketplace = marketplacejs.FincontractMarketplace(web3);
    web3.eth.defaultAccount = web3.eth.coinbase;
    vorpal.log(ok('Connected to node: ' + url));
  } else
    vorpal.log(error('Did NOT connect, is node running at ' + url + ' ?'));
};

const checkAndRegisterAccount = () => {

  if (!marketplace.isRegistered.call()) {
    const registeredEvent = marketplace.Registered({});
    registeredEvent.watch((err, res) => {
      if (!err) {
        vorpal.log(chalk.blue("Registered account: " + res.args.user));
        registeredEvent.stopWatching();
      } else 
        vorpal.log(error("Error when registering user: " + err));
    });  
    marketplace.register.sendTransaction({gas: 4000000, gasPrice : 100}, (err, res) => {
      if (!err) {
        vorpal.log(info("Register transaction was sent with transaction hash:\n" + res));
      }
    });
  } else {
    vorpal.log(info("You are already registered!"));
  }
};

const deployTestFincontract = (name, args) => {
  const d = new deployer.Deployer(marketplace);
  return d.sendTransaction(name, args, 'CreatedBy', (logs) => {
    const fctID = logs.args.fctId;
    const owner = logs.args.user;
    vorpal.log(chalk.blue("Fincontract: " + fctID + "\nCreated for: " + owner));
    if (storage.addFincontractID(fctID))
      vorpal.log(info('ID added to autocomplete!'));    
    return fctID;
  });
};

const deploymentTest = (index) => {
  switch (index) {
    case 1: return deployTestFincontract('simpleTest', [0x0]);
    case 2: return deployTestFincontract('complexScaleObsTest', [0x0]);
    case 3: {
      const lowerBound = Math.round(Date.now() / 1000 + 120);
      const upperBound = Math.round(Date.now() / 1000 + 3600);
      return deployTestFincontract('timeboundTest', [0x0, lowerBound, upperBound]);
    }
    default: vorpal.log(warn('Test case does not exist!')); break;
  }
}

const printFincontract = (name, fincontract, detailed) => {
  vorpal.log(info('Fincontract:' + name + '\tID:\t' + fincontract.id));
  if (detailed) {
    vorpal.log(info('Owner:\t\t' + fincontract.owner));
    vorpal.log(info('Issuer:\t\t' + fincontract.issuer));
    vorpal.log(info('Proposed Owner:\t' + fincontract.proposedOwner));
    vorpal.log(info('Description:\t\t' + fincontract.description));    
  }
  vorpal.log('');
}

/* TODO - remove at the end */
connectToEthereumNode('localhost:8000');

vorpal
  .command('connect <host>')
  .autocomplete(['localhost:8000'])
  .description('Connnects to a local Ethereum node')
  .action((args, cb) => {
    connectToEthereumNode(args.host);
    cb();
  });

vorpal
  .command('create <expr>')
  .option('-i, --issue [address]', 'Issues the fincontract after deploying to given address')
  .option('-s, --save  [name]', )
  .description('Creates fincontract and deploys it to the blockchain')
  .validate(isNodeConnected)
  .action((args, cb) => {
    const p = new parser.Parser();
    const d = new deployer.Deployer(marketplace);
    const desc = p.parse(args.expr);
    const promise = d.deploy(desc);

    if (args.options.issue) {
      promise.then((fctID) => d.issueFincontract(fctID, args.options.issue));
    }

    if (args.options.save) {
      const name = args.options.save;
      promise.then((fctID) => {
        const ff = new fincFactory.FincontractFactory(marketplace);
        const fincontract = ff.pullFincontract(fctID);
        const srz = new serializer.Serializer();
        const serialized = srz.serialize(fincontract);
        vorpal.log(serialized);
      });
    }
    cb();
  })

vorpal
  .command('pull <fincontract_id>')
  .autocomplete({ data: () => storage.getFincontractIDs() })
  .option('-s, --save [name]', 'Save fincontract description as [name]')
  .option('-e, --eval [method]', 'Evaluate fincontract using a method', ['now', 'estimate'])
  .types({string: ['_']})
  .description('Pulls contract from blockchain.')
  .validate(isNodeConnected)
  .action((args, cb) => {
    
    vorpal.log(args)
    
    const id = parseAddress(args.fincontract_id);
    const ff = new fincFactory.FincontractFactory(marketplace);
    const fincontract = ff.pullFincontract(id);
    
    if (fincontract) {
      vorpal.log(fincontract);
      vorpal.log(parseInt(fincontract.issuer));
      vorpal.log(fincontract.rootDescription);

      if (args.options.eval == 'now')
        vorpal.log(warn("not yet implemented!"));
      else if (args.options.eval == 'estimate') {
        const evalVisitor = new evaluator.Evaluator();
        const evaled = fincontract.rootDescription.accept(evalVisitor);
        vorpal.log(chalk.cyan(evaled));
      }

      if (args.options.save) {
        const name = args.options.save;
        const srz = new serializer.Serializer();
        const serialized = srz.serialize(fincontract);
        if (storage.addFincontract(name, serialized))
          vorpal.log(info('Fincontract saved as \'' + name + '\''));
        else
          vorpal.log(warn('Fincontract with this name already exists!'));
      }

      if (storage.addFincontractID(id))
        vorpal.log(info('ID added to autocomplete!'));

    } else {
      vorpal.log(error("Contract was not found!"));
    }
    
    cb();
  });

vorpal
  .command('list')
  .option('-d, --detail', 'Lists detailed description of the fincontracts')
  .validate(isNodeConnected)
  .description('Lists all contracts')
  .action((args, cb) => {
    const fincontracts = storage.getFincontracts()
    for (const name in fincontracts) {
      printFincontract(name, fincontracts[name], args.options.detail);
    }
    cb();
  })

vorpal
  .command('reset')
  .description('Wipes out all user settings (autocomplete, etc)')
  .action(function(args, cb){
    this.prompt({
      type: 'confirm',
      name: 'continue',
      message: 'Are you sure you want to remove all user settings?',
    }, (result) => {
      if (!result.continue) {
        vorpal.log(ok('Good move.'));
      } else {
        vorpal.log(error('All settings were deleted!'));
        storage.wipe();
      }
      cb();
    });
  });

vorpal
  .command('register')
  .validate(isNodeConnected)
  .description('Registers current account')
  .action((args, cb) => {
    checkAndRegisterAccount();
    cb();
  })

vorpal
  .command('deploytest <index>')
  .validate(isNodeConnected)
  .action((args, cb) => {
    deploymentTest(args.index);
    cb();
  });

vorpal.delimiter(chalk.magenta(figures.pointer)).show();