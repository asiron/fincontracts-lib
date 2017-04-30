#!/usr/bin/env node --harmony
import {BigNumber} from 'bignumber.js';
import {Gateway} from '../contracts/bin/gateway';
import {GatewayInteger} from '../contracts/bin/gatewayint';
import {GatewayBool} from '../contracts/bin/gatewaybool';
import {FincontractMarketplace} from '../contracts/bin/marketplace';
import Serializer from './lib/fincontract-serializer';
import Evaluator from './lib/fincontract-evaluator';
import Deployer from './lib/fincontract-deployer';
import Executor from './lib/fincontract-executor';
import Examples from './lib/fincontract-examples';
import Fetcher from './lib/fincontract-fetcher';
import Parser from './lib/fincontract-parser';
import Sender from './lib/tx-sender';
import FincontractStorage from './storage';
import Currency from './lib/currency';

const figures = require('figures');
const logSymbols = require('log-symbols');
const cli = require('vorpal')();
const chalk = require('chalk');
const Web3 = require('web3');

const web3 = new Web3();
let marketplace = null;
let gateway = null;
let gatewayint = null;
let gatewaybool = null;

const error = msg => chalk.bold.red(`${figures.cross} ${msg}`);
const warn = msg => chalk.yellow(`${logSymbols.warning} ${msg}`);
const info = msg => chalk.blue(`${logSymbols.info} ${msg}`);
const ok = msg => chalk.green(`${figures.tick} ${msg}`);

/* Setting up local-storage hook */
cli.localStorage('fincontract-client');
const storage = new FincontractStorage(cli.localStorage);

function parseBigNum(str) {
  try {
    return new BigNumber(str);
  } catch (err) {
    cli.log(error('Error: Not a number!'));
  }
}
const zfill = (num, len) => (Array(len).join('0') + num).slice(-len);
function parseAddress(str) {
  const id = parseBigNum(str) || '0';
  return '0x' + zfill(id.toString(16), 64);
}

const isNodeConnected = () => web3.isConnected() || error('Node is not connected');
function connectToEthereumNode(url) {
  const provider = new web3.providers.HttpProvider(url);
  web3.setProvider(provider);
  if (isNodeConnected() === true) {
    marketplace = FincontractMarketplace(web3);
    gateway = Gateway(web3);
    gatewayint = GatewayInteger(web3);
    gatewaybool = GatewayBool(web3);
    web3.eth.defaultAccount = web3.eth.coinbase;
    return true;
  }
  return false;
}

async function checkAndRegisterAccount() {
  if (!marketplace.isRegistered.call()) {
    return new Sender(marketplace, web3)
      .send('register', [])
      .watch({event: 'Registered'}, logs => logs.args.user);
  }
}

function printFincontract(name, fincontract, detailed) {
  cli.log(info(`Fincontract:\t ${name}`));
  cli.log(info(`ID:\t ${fincontract.id}`));
  if (detailed) {
    cli.log(info(`Owner:\t\t ${fincontract.owner}`));
    cli.log(info(`Issuer:\t\t ${fincontract.issuer}`));
    cli.log(info(`Proposed Owner:\t ${fincontract.proposedOwner}`));
    cli.log(info(`Description:\t\t ${fincontract.description}`));
  }
  cli.log('');
}

function saveFincontract(fincontract, name, overwrite) {
  const srz = new Serializer();
  const serialized = srz.serialize(fincontract);
  if (storage.addFincontract(name, serialized, overwrite)) {
    cli.log(info(`Fincontract saved as '${name}'`));
  } else {
    cli.log(warn('Fincontract with this name already exists!'));
  }
}

function autocompleteAccounts() {
  if (!web3.isConnected()) {
    return [];
  }
  const accounts = web3.eth.accounts;
  const indicies = [...Array(accounts.length).keys()].map(x => x.toString());
  return [...indicies, ...accounts];
}

connectToEthereumNode('http://localhost:8000');

cli
  .command('connect <host>').alias('c')
  .autocomplete(['localhost:8000'])
  .description('Connnects to a local Ethereum node')
  .action((args, cb) => {
    const url = `http://${args.host}`;
    if (connectToEthereumNode(url)) {
      cli.log(ok(`Connected to node: ${url}`));
    } else {
      cli.log(error(`Did NOT connect, is node running at ${url} ?`));
    }
    cb();
  });

cli
  .command('register').alias('r')
  .validate(isNodeConnected)
  .description('Registers currently selected account')
  .action(async (args, cb) => {
    const user = await checkAndRegisterAccount();
    if (user) {
      cli.log(info(`Registered account: ${user}`));
    } else {
      cli.log(warn(`You are already registered!`));
    }
    cb();
  });

cli
  .command('show-balance').alias('sb')
  .validate(isNodeConnected)
  .description('Shows balance of currently selected account')
  .action((args, cb) => {
    const balance = Currency.convertToJSON(marketplace.getMyBalance.call());
    cli.log(ok(JSON.stringify(balance)));
    cb();
  });

cli
  .command('select-account <index-or-address>').alias('sa')
  .autocomplete({data: () => autocompleteAccounts()})
  .description('Selects an Ethereum account for sending transactions')
  .validate(isNodeConnected)
  .action((args, cb) => {
    const identifier = args['index-or-address'];
    const accounts = web3.eth.accounts;
    if (accounts.includes(identifier)) {
      web3.eth.defaultAccount = identifier;
      cli.log(ok(`Account selected: ${identifier}`));
    } else if (accounts[identifier]) {
      web3.eth.defaultAccount = accounts[identifier];
      cli.log(ok(`Account selected: ${accounts[identifier]}`));
    } else {
      cli.log(error(`Wrong account address or index: ${identifier}`));
    }
    cb();
  });

cli
  .command('list-accounts').alias('la')
  .description('Lists Ethereum accounts')
  .action((args, cb) => {
    cli.log(info('Available Ethereum accounts:'));
    web3.eth.accounts.forEach((account, index) => {
      cli.log(info(`${index}: ${account}`));
    });
    cb();
  });

cli
  .command('create-fincontract <expr>').alias('cf')
  .option('-i, --issue <address>', 'Issues the fincontract after deploying to given address')
  .option('-s, --save  <name>', 'Saves the contract after deploying to local storage')
  .option('-ow, --overwrite', 'Overwrites the contract if it already exists with same name!')
  .types({string: ['i', 'issue']})
  .description('Creates fincontract and deploys it to the blockchain')
  .validate(isNodeConnected)
  .action(async (args, cb) => {
    const expression = args.expr;
    const p = new Parser();
    const d = new Deployer(marketplace, web3);
    try {
      let createdFincontractID;
      const desc = await p.parse(expression);
      if (args.options.issue) {
        const proposedOwner = parseAddress(args.options.issue);
        createdFincontractID = await d.issue(desc, proposedOwner);
      } else {
        createdFincontractID = await d.deploy(desc);
      }

      if (args.options.save) {
        const name = args.options.save;
        const ow = args.options.overwrite;
        const f = new Fetcher(marketplace);
        const fincontract = await f.pullFincontract(createdFincontractID);
        saveFincontract(fincontract, name, ow);
      }
    } catch (err) {
      cli.log(error(err));
    }
    cb();
  });

cli
  .command('join-fincontract <id>').alias('jf')
  .autocomplete({data: () => storage.getFincontractIDs()})
  .option('-o, --or [choice]', 'Select sub-fincontract from a root OR node', ['first', 'second'])
  .types({string: ['_']})
  .validate(isNodeConnected)
  .description('Joins a fincontract from the currently selected account')
  .action(async (args, cb) => {
    const exec = new Executor(marketplace, gateway, web3);
    const id = parseAddress(args.id);
    try {
      let executed;
      const choice = args.options.or;
      if (['first', 'second'].includes(choice)) {
        const mapping = {first: 1, second: 0};
        executed = await exec.choose(id, mapping[choice]);
      } else {
        executed = await exec.join(id);
      }
      cli.log(info(JSON.stringify(executed)));
    } catch (err) {
      cli.log(error(err));
    }
    cb();
  });

cli
  .command('pull-fincontract <id>').alias('pf')
  .autocomplete({data: () => storage.getFincontractIDs()})
  .option('-s, --save <name>', 'Save fincontract description as [name]')
  .option('-e, --eval <method>', 'Evaluate fincontract using a method', ['direct', 'estimate'])
  .option('--convert <base>', 'Convert result of evaluation to currency', Object.values(Currency.Currencies))
  .option('--overwrite', 'Overwrites the contract if it already exists with same name!')
  .types({string: ['_']})
  .description('Pulls contract from blockchain.')
  .validate(isNodeConnected)
  .action(async (args, cb) => {
    try {
      const id = parseAddress(args.id);
      const f = new Fetcher(marketplace);

      const fincontract = await f.pullFincontract(id);
      if (storage.addFincontractID(id)) {
        cli.log(info('ID added to autocomplete!'));
      }
      if (args.options.save) {
        const name = args.options.save;
        const ow = args.options.overwrite;
        saveFincontract(fincontract, name, ow);
      }
      if (args.options.eval) {
        const e = new Evaluator(gateway, web3);
        const base = args.options.convert || 'USD';
        const method = args.options.eval;
        const evaluated = await e.evaluate(fincontract.rootDescription, {method});
        const currencies = Currency.convertToJSON(evaluated);
        const exchanged = await Currency.changeAllCurrencies(base, currencies);
        cli.log(info(JSON.stringify(currencies)));
        cli.log(info(JSON.stringify(exchanged)));
      }
    } catch (err) {
      cli.log(error(err));
    }
    cb();
  });

cli
  .command('show-fincontract <name>').alias('sf')
  .autocomplete({data: () => Object.keys(storage.getFincontracts())})
  .validate(isNodeConnected)
  .description('Shows detailed information about a saved fincontract')
  .action((args, cb) => {
    const name = args.name;
    const fincontract = storage.getFincontractByName(name);
    if (fincontract) {
      printFincontract(name, fincontract, true);
    } else {
      cli.log(error('Contract not found!'));
    }
    cb();
  });

cli
  .command('list-fincontracts').alias('lf')
  .option('-d, --detail', 'Lists detailed description of the fincontracts')
  .validate(isNodeConnected)
  .description('Lists all saved fincontracts')
  .action((args, cb) => {
    const fincontracts = storage.getFincontracts();
    Object.keys(fincontracts).forEach(name => {
      printFincontract(name, fincontracts[name], args.options.detail);
    });
    cb();
  });

cli
  .command('delete-settings').alias('ds')
  .description('Wipes out all user settings (autocomplete, saved fincontracts)')
  .action(function (args, cb) {
    this.prompt({
      type: 'confirm',
      name: 'continue',
      message: 'Are you sure you want to remove all user settings?'
    }, result => {
      if (result.continue) {
        cli.log(error('All settings were deleted!'));
        storage.wipe();
      } else {
        cli.log(ok('Good move.'));
      }
      cb();
    });
  });

cli
  .command('example <index>').alias('ex')
  .autocomplete(Examples.AllExamples)
  .validate(isNodeConnected)
  .description('Deploys one of the examples from marketplace smart contract')
  .action(async (args, cb) => {
    try {
      const ex = new Examples(marketplace, gatewaybool, gatewayint, web3);
      const fctID = await ex.runExample(args.index);
      if (storage.addFincontractID(fctID)) {
        cli.log(info('ID added to autocomplete!'));
      }
    } catch (err) {
      cli.log(error(err));
    }
    cb();
  });

cli.delimiter(chalk.magenta(figures.pointer)).show();
