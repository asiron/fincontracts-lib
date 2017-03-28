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

vorpal.localStorage('fincontract-client');

const pullIdsFromStorage = () => JSON.parse(vorpal.localStorage.getItem('fincontract-ids')) || [];
const addFincontractIdToStorage = (id) => {
  let ids = pullIdsFromStorage();
  if (ids.includes(id)) return false;
  ids = ids.concat([id]);
  vorpal.localStorage.setItem('fincontract-ids', JSON.stringify(ids));
  vorpal.log(info("id added to autocomplete"));
  return true;
}

const parseBigNum = (str) => {
  try {
    return new BigNumber(str);
  } catch (e) {
    vorpal.log(error("Not a number!"));
  }
}

const isNodeConnected = _ => web3.isConnected() || error("Node is not connected");
const connectToEthereumNode = (host) => {
  let url = 'http://' + host;
  let provider = new web3.providers.HttpProvider(url);
  web3.setProvider(provider);  
  if (isNodeConnected() == true) {
    marketplace = marketplacejs.FincontractMarketplace(web3);
    web3.eth.defaultAccount = web3.eth.coinbase;
    vorpal.log(ok('Connected to node: ' + url));
  } else
    vorpal.log(error('Did NOT connect, is node running at ' + url + ' ?'));
};

const watchCreatedBy = () => {
  const createdByEvent = marketplace.CreatedBy({toBlock : 'pending'});
  createdByEvent.watch((err, res) => {
    if (!err) {
      let fincontractId    = res.args.fctId;
      let fincontractOwner = res.args.user;
      vorpal.log(chalk.blue("Fincontract: " + fincontractId + "\nCreated for: " + fincontractOwner));
      addFincontractIdToStorage(fincontractId);
      //createdByEvent.stopWatching();
    } else 
      vorpal.log(error("Error when creating contract: " + err));
  });
}

const watchRegistered = () => {
  const registeredEvent = marketplace.Registered({});
  registeredEvent.watch((err, res) => {
    if (!err) {
      vorpal.log(chalk.blue("Registered: " + res.args.user));
      registeredEvent.stopWatching();
    } else 
      vorpal.log(error("Error when registering user: " + err));
  });
}

const deployTestContract = _ => {
  watchCreatedBy();
  watchRegistered();

  // marketplace.register.sendTransaction({gas: 4000000, gasPrice : 1}, (err, res) => {
  //   if (!err) vorpal.log(info("Register transaction was sent with transaction hash:\n" + res));
  // });

  marketplace.complexScaleObsTest.sendTransaction(0x0, {gas: 4000000, gasPrice : 100}, (err, res) => {
    if (!err) {
      vorpal.log(info("complexScaleObsTest transaction was sent with transaction hash:\n" + res));
    }
  });

  let lowerBound = Math.round(Date.now() / 1000 + 120);
  let upperBound = Math.round(Date.now() / 1000 + 3600);
  marketplace.timeboundTest.sendTransaction(0x0, lowerBound, upperBound, {gas: 4000000, gasPrice : 100}, (err, res) => {
    if (!err) {
      vorpal.log(info("timeboundTest transaction was sent with transaction hash:\n" + res));
    }
  });
}

// remove at the end
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
  .command('pull <fincontract_id>')
  .autocomplete({ data: pullIdsFromStorage })
  .option('-s, --save [filename]', 'Save fincontract description as [filename]')
  .option('-e, --eval [method]',   'Evaluate fincontract using a method', ['now', 'estimate'])
  .types({string: ['_']})
  .description('Pulls contract from blockchain.')
  .validate(isNodeConnected)
  .action((args, cb) => {
    vorpal.log(args)
    
    let id = parseBigNum(args.fincontract_id) || '0'
    let idString = '0x' + id.toString(16)
    let ff = new fincFactory.FincontractFactory(marketplace);
    let testFincontract = ff.pullContract(idString);
    
    if (testFincontract) {
      vorpal.log(testFincontract);
      vorpal.log(parseInt(testFincontract.issuer));
      vorpal.log(testFincontract.rootDescription);

      if (args.options.eval == 'now')
        vorpal.log(warn("not yet implemented!"));
      else if (args.options.eval == 'estimate')
        vorpal.log(chalk.cyan(testFincontract.rootDescription.eval()));

      if (args.options.save)
        vorpal.log(warn("not yet implemented!"));

      addFincontractIdToStorage(idString);

    } else {
      vorpal.log(error("Contract was not found!"));
    }
    
    cb();
  });


vorpal
  .command('deploy')
  .validate(isNodeConnected)
  .action((args, cb) => {
    deployTestContract();
    cb();
  });

vorpal.delimiter(chalk.magenta(figures.pointer)).show();
