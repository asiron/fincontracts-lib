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

const marketplacejs = require('../contracts/bin/marketplace.js');
const fetcher    = require("./fincontract-fetcher");
const evaluator  = require("./fincontract-evaluator");
const serializer = require("./fincontract-serializer");
const parser     = require('./fincontract-parser');
const deployer   = require('./fincontract-deployer');
const examples   = require('./fincontract-examples')
const sender     = require('./tx-sender');

var marketplace  = null;

/* setting up local-storage hook */
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
    const s = new sender.Sender(marketplace, web3);
    s.send('register', [], {event: 'Registered'}, (logs) => {
      vorpal.log(chalk.blue("Registered account: " + logs.args.user));
      return logs.args.user;
    });
  } else {
    vorpal.log(info("You are already registered!"));
  }
};

const printFincontract = (name, fincontract, detailed) => {
  vorpal.log(info('Fincontract:\t' + name));
  vorpal.log(info('ID:\t' + fincontract.id));
  if (detailed) {
    vorpal.log(info('Owner:\t\t' + fincontract.owner));
    vorpal.log(info('Issuer:\t\t' + fincontract.issuer));
    vorpal.log(info('Proposed Owner:\t' + fincontract.proposedOwner));
    vorpal.log(info('Description:\t\t' + fincontract.description));    
  }
  vorpal.log('');
}

const saveFincontract = (fincontract, name) => {
  const srz = new serializer.Serializer();
  const serialized = srz.serialize(fincontract);
  if (storage.addFincontract(name, serialized))
    vorpal.log(info('Fincontract saved as \'' + name + '\''));
  else
    vorpal.log(warn('Fincontract with this name already exists!'));
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
  .option('-s, --save  [name]', 'Saves the contract after deploying to local storage')
  .description('Creates fincontract and deploys it to the blockchain')
  .validate(isNodeConnected)
  .action((args, cb) => {
    const p = new parser.Parser();
    const d = new deployer.Deployer(marketplace, web3);

    let promise = p.parse(args.expr);
    if (args.options.issue) {
      const proposedOwner = parseAddress(args.options.issue);
      promise = promise.then(desc => d.issue(desc, proposedOwner));
    } else {
      promise = promise.then(desc => d.deploy(desc));
    }

    if (args.options.save) {
      const name = args.options.save;
      const f = new fetcher.Fetcher(marketplace);
      promise = promise.then(fctID => f.pullFincontract(fctID))
        .then(fincontract => saveFincontract(fincontract, name))
    }
    promise.catch(e => vorpal.log(error(e)));
    cb();
  });

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
    const f = new fetcher.Fetcher(marketplace);

    f.pullFincontract(id)
      .then(fincontract => {
        if (storage.addFincontractID(id))
          vorpal.log(info('ID added to autocomplete!'));
        return Promise.resolve(fincontract);
      })
      .then(fincontract => {
        if (args.options.save) {
          const name = args.options.save;
          saveFincontract(fincontract, name);
        }
        return Promise.resolve(fincontract);
      })
      .then(fincontract => {
        if (args.options.eval) {
          const method = args.options.eval;
          const e = new evaluator.Evaluator(marketplace, web3);
          return e.evaluate(fincontract, {method: method})
            .catch(e => vorpal.log(error(e)))
            .then((res) => vorpal.log(chalk.cyan(res)))
        }
      })
      .catch(e => vorpal.log(error(e)));

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
  });

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
  .command('example <index>')
  .autocomplete(examples.AllExamples)
  .validate(isNodeConnected)
  .description('Deploys one of the examples from marketplace smart contract')
  .action((args, cb) => {
    const ex = new examples.Examples(marketplace, web3);
    ex.runExample(args.index).then(fctID => {
      if (storage.addFincontractID(fctID))
        vorpal.log(info('ID added to autocomplete!'));   
    }).catch(e => vorpal.log(error(e)));

    cb();
  });

vorpal.delimiter(chalk.magenta(figures.pointer)).show();
