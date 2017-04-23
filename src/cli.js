#!/usr/bin/env node --harmony
const vorpal  = require('vorpal')();
const chalk   = require('chalk');
var Web3 = require('web3');
var web3 = new Web3();
var marketplace  = null;

import * as figures from 'figures'
import * as logSymbols from 'log-symbols';

import { BigNumber } from 'bignumber.js';
import { FincontractMarketplace } from '../contracts/bin/marketplace';

import Serializer from './fincontract-serializer';
import Evaluator  from './fincontract-evaluator';
import Deployer   from './fincontract-deployer';
import Examples   from './fincontract-examples';
import Fetcher    from './fincontract-fetcher';
import Parser     from './fincontract-parser';
import Sender     from './tx-sender';
import Storage    from './storage';

import * as Currency from './currency';

const error  = msg => chalk.bold.red(`${figures.cross} ${msg}`);
const ok     = msg => chalk.green(`${figures.tick} ${msg}`);
const warn   = msg => chalk.yellow(`${logSymbols.warning} ${msg}`);
const info   = msg => chalk.blue(`${logSymbols.info} ${msg}`);

/* setting up local-storage hook */
vorpal.localStorage('fincontract-client');
const storage = new Storage(vorpal.localStorage);

const parseAddress = (str) => {
  const id = parseBigNum(str) || '0'
  return '0x' + zfill(id.toString(16), 64)
}
const zfill = (num, len) => (Array(len).join('0') + num).slice(-len)
const parseBigNum = (str) => {
  try {
    return new BigNumber(str);
  } catch (e) {
    vorpal.log(error('Not a number!'));
  }
}

const isNodeConnected = _ => web3.isConnected() || error('Node is not connected');
const connectToEthereumNode = (host) => {
  const url = `http://${host}`;
  const provider = new web3.providers.HttpProvider(url);
  web3.setProvider(provider);  
  if (isNodeConnected() === true) {
    marketplace = FincontractMarketplace(web3);
    web3.eth.defaultAccount = web3.eth.coinbase;
    vorpal.log(ok(`Connected to node: ${url}`));
  } else
    vorpal.log(error(`Did NOT connect, is node running at ${url} ?`));
};

const checkAndRegisterAccount = () => {
  if (!marketplace.isRegistered.call()) {
    const s = new Sender(marketplace, web3);
    s.send('register', [], {event: 'Registered'}, (logs) => {
      vorpal.log(chalk.blue(`Registered account: ${logs.args.user}`));
      return logs.args.user;
    });
  } else {
    vorpal.log(info('You are already registered!'));
  }
};

const printFincontract = (name, fincontract, detailed) => {
  vorpal.log(info(`Fincontract:\t ${name}`));
  vorpal.log(info(`ID:\t' ${fincontract.id}`));
  if (detailed) {
    vorpal.log(info(`Owner:\t\t' ${fincontract.owner}`));
    vorpal.log(info(`Issuer:\t\t' ${fincontract.issuer}`));
    vorpal.log(info(`Proposed Owner:\t' ${fincontract.proposedOwner}`));
    vorpal.log(info(`Description:\t\t' ${fincontract.description}`));    
  }
  vorpal.log('');
}

const saveFincontract = (fincontract, name, overwrite) => {
  const srz = new Serializer();
  const serialized = srz.serialize(fincontract);
  if (storage.addFincontract(name, serialized, overwrite))
    vorpal.log(info(`Fincontract saved as '${name}'`));
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
  .option('-i, --issue <address>', 'Issues the fincontract after deploying to given address')
  .option('-s, --save  <name>', 'Saves the contract after deploying to local storage')
  .option('--overwrite', 'Overwrites the contract if it already exists with same name!')
  .description('Creates fincontract and deploys it to the blockchain')
  .validate(isNodeConnected)
  .action((args, cb) => {
    const p = new Parser();
    const d = new Deployer(marketplace, web3);

    let promise = p.parse(args.expr);
    if (args.options.issue) {
      const proposedOwner = parseAddress(args.options.issue);
      promise = promise.then(desc => d.issue(desc, proposedOwner));
    } else {
      promise = promise.then(desc => d.deploy(desc));
    }

    if (args.options.save) {
      const name = args.options.save;
      const ow = args.options.overwrite;
      const f = new Fetcher(marketplace);
      promise = promise.then(fctID => f.pullFincontract(fctID))
        .then(fincontract => saveFincontract(fincontract, name, ow))
    }
    promise.catch(e => vorpal.log(error(e)));
    cb();
  });

vorpal
  .command('pull <fincontract_id>')
  .autocomplete({ data: () => storage.getFincontractIDs() })
  .option('-s, --save <name>', 'Save fincontract description as [name]')
  .option('-e, --eval <method>', 'Evaluate fincontract using a method', ['direct', 'estimate'])
  .option('--convert <base>', 'Convert result of evaluation to currency', Object.values(Currency.Currencies))
  .option('--overwrite', 'Overwrites the contract if it already exists with same name!')
  .types({string: ['_']})
  .description('Pulls contract from blockchain.')
  .validate(isNodeConnected)
  .action((args, cb) => {
    
    vorpal.log(args)
    
    const id = parseAddress(args.fincontract_id);
    const f = new Fetcher(marketplace);

    f.pullFincontract(id)
      .then(fincontract => {
        if (storage.addFincontractID(id))
          vorpal.log(info(`ID added to autocomplete!`));
        return Promise.resolve(fincontract);
      })
      .then(fincontract => {
        if (args.options.save) {
          const name = args.options.save;
          const ow = args.options.overwrite;
          saveFincontract(fincontract, name, ow);
        }
        return Promise.resolve(fincontract);
      })
      .then(fincontract => {
        if (args.options.eval) {
          const e = new Evaluator(web3);
          const base = args.options.convert || `USD`;
          const method = args.options.eval;
          const evaluated = e.evaluate(fincontract, {method: method})
            .then((list) => Currency.convertToJSON(list));

          evaluated
            .then((currencies) => Currency.changeAllCurrencies(base, currencies))
            .then((res) => vorpal.log(chalk.cyan(JSON.stringify(res))));
          evaluated
            .then((res) => vorpal.log(chalk.cyan(JSON.stringify(res))));
        }
      })
      .catch(e => vorpal.log(error(e)));

    cb();
  });

vorpal
  .command('show <name>')
  .autocomplete({ data: () => Object.keys(storage.getFincontracts())})
  .validate(isNodeConnected)
  .description('Shows detailed information about saved contract')
  .action((args, cb) => {
    const name = args.name;
    const fincontract = storage.getFincontractByName(name);
    if (fincontract) 
      printFincontract(name, fincontract, true);
    else
      vorpal.log(error('Contract not found!'));
    cb();
  });

vorpal
  .command('list')
  .option('-d, --detail', 'Lists detailed description of the fincontracts')
  .validate(isNodeConnected)
  .description('Lists all contracts')
  .action((args, cb) => {
    const fincontracts = storage.getFincontracts();
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
  .autocomplete(Examples.AllExamples)
  .validate(isNodeConnected)
  .description('Deploys one of the examples from marketplace smart contract')
  .action((args, cb) => {
    const ex = new Examples(marketplace, web3);
    ex.runExample(args.index).then(fctID => {
      if (storage.addFincontractID(fctID))
        vorpal.log(info('ID added to autocomplete!'));   
    }).catch(e => vorpal.log(error(e)));

    cb();
  });

vorpal.delimiter(chalk.magenta(figures.pointer)).show();
