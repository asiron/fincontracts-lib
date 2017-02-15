#!/usr/bin/env node

const logResult = (err, result) => console.log("Error:" + err + " Result:" + result)

import FincontractFactory from "./fincontract_factory";

const web3 = require('web3');
web3 = new web3(new web3.providers.HttpProvider('http://localhost:8000'));

const marketplace = require('../contracts/bin/marketplace.js')
marketplace       = marketplace.FincontractMarketplace(web3)

web3.eth.defaultAccount = web3.eth.coinbase;

marketplace.register.sendTransaction({gas: 4000000, gasPrice : 100}, (err, result) => {
  if (!err) {
    console.log("Register transaction was sent with transaction hash:");
    console.log(result);
  }
});

let createdByEvent = marketplace.CreatedBy({}, (err, result) => {
  if (!err) {
    console.log("Fincontract: " + result.args.fctId + "\nCreated for: " + result.args.user);
    let ff = new FincontractFactory(marketplace);
    let testFincontractId = result.args.fctId;
    let testFincontract   = ff.pullContract(testFincontractId);
    console.log(testFincontract.rootDescription.eval());
    createdByEvent.stopWatching();
  } else 
    console.log("Error when creating contract: " + err);
});

marketplace.complexScaleObsTest.sendTransaction(0x0, {gas: 4000000, gasPrice : 100}, (err, result) => {
  if (!err) {
    console.log("ComplexScaleObsTest transaction was sent with transaction hash:");
    console.log(result);
  }
});

console.log('OK!');