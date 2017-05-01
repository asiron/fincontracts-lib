# fincontracts-lib
Copyright (C) 2017 - Maciej Żurad, University of Luxembourg

JavaScript library for interacting with Fincontracts deployed on the Ethereum blockchain

### Installation

Run this command in your project's root directory to install the package.
```
npm install --save fincontracts-lib
```

### Getting started
In order to use most of the functionality of **fincontracts-lib**, you will need:

  * an instance of [web3.js](https://github.com/ethereum/wiki/wiki/JavaScript-API) provider connected to an Ethereum node, e.g. [geth](https://github.com/ethereum/go-ethereum/wiki/geth).
  * an instance of [FincontractMarketplace](https://bitbucket.org/s-tikhomirov/fincontracts.git) smart contract, which was compiled and deployed on the blockchain. We usually refer to that instance in the documentation, when we say **FincontractMarketplace**
  * an interface/class of [Gateway](https://bitbucket.org/s-tikhomirov/fincontracts.git) smart contract, which couldn't be deployed to the blockchain as its an abstract smart contract, but must be instantiated on demand with a given **Gateway** address during various Fincontract processing

### Examples

#### Deployer

**Deployer** allows for Fincontract deployment

```
const Deployer = require('./fincontract-deployer');
try {
  const d = new Deployer(marketplace, web3);
  const id = await d.deploy(fincontract);
catch (err) {
  console.log(err);
}
```

### Documentation

You can clone this repo and build documentation locally, if you wish to do so, run:
```
npm run docs
```
Now, you can simply navigate to `docs/index.html` and browse the documentation.
