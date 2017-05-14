# fincontracts-lib
Copyright (C) 2017 - Maciej Żurad, University of Luxembourg

Node.js package for interacting with Fincontracts deployed on the Ethereum blockchain.

## Installation

Run this command in your project's root directory to install the package.
```bash
npm install --save fincontracts-lib
```

You can now import the package using:
```javascript
const finlib = require('fincontracts-lib');
```

## Getting started
In order to use most of the functionality of **fincontracts-lib**, you will need:

  * an instance of [web3.js](https://github.com/ethereum/wiki/wiki/JavaScript-API) provider connected to an Ethereum node, e.g. [geth](https://github.com/ethereum/go-ethereum/wiki/geth).
  * an instance of [FincontractMarketplace](https://bitbucket.org/s-tikhomirov/fincontracts.git) smart contract, which was compiled and deployed on the blockchain. We usually refer to that instance in the documentation, when we say **FincontractMarketplace**
  * an interface/class of [Gateway](https://bitbucket.org/s-tikhomirov/fincontracts.git) smart contract, which couldn't be deployed to the blockchain as its an abstract smart contract, but must be instantiated on demand with a given **Gateway** address during Fincontract processing, such as [execution](#Executor)

## Documentation
Documentation is hosted [here](https://doc.esdoc.org/github.com/asiron/fincontracts-lib/) 
thanks to ESDoc!
Alternatively, you can clone this repo and build documentation locally. If you wish to do so, run:
```bash
npm run docs
```
Now, you can simply navigate to `docs/index.html` and browse the documentation.


## Projects
[fincontract-cli](https://github.com/asiron/fincontracts-cli) is an example project
which uses **fincontracts-lib**. It contains scripts for running your own
private blockchain, deploying smart contracts and generating JavaScript files
with instantiation scripts necessary for using this library as already stated.

## Examples

These examples show core functionality of the **fincontracts-lib** package.
Everytime, we refer to these variables, we mean:

  * `fincontract` is Fincontract's description tree
  * `marketplace` is FincontractMarketplace smart contract instance
  * `web3` is web3.js instance connected to an Ethereum node

### Deployer

**Deployer** allows for Fincontract deployment and issuence. Following example
deploys the Fincontract and issues it to everyone.

```javascript
const finlib = require('./fincontracts-lib');
try {
  const d = new finlib.Deployer(marketplace, web3);
  const id = await d.issue(fincontract, '0x0');
catch (err) {
  console.log(err);
}
```

### Evaluator

**Evaluator** allows for evaluation of an instantiated Fincontract.
The following example first pulls the Fincontract from the blockchain and then
evaluates it using `estimate` method and converts all currencies to `USD`

```javascript
const finlib = require('./fincontracts-lib');
const f = new finlib.Fetcher(marketplace);
const e = new finlib.Evaluator(web3, gateway);
const method = `estimate`;
const id = '<32 byte address of a deployed Fincontract>';
try {
  const fincontract = await f.pullFincontract(id);
  const evaluated   = await e.evaluate(fincontract.rootDescription, {method});
  const currencies  = finlib.Currency.convertToJSON(evaluated);
  const exchanged   = await finlib.Currency.changeAllCurrencies('USD', currencies);
  console.log(JSON.stringify(evaluated));
  console.log(JSON.stringify(exchanged));
} catch (err) {
  console.log(error(err));
}
```

### Executor

**Executor** allows for execution of a deployed Fincontract given its address.
It also allows for choosing a sub-fincontract if the top-level node is an OR node.
For more details, consult the documentation ( `Executor#choose` )
The following example joins the Fincontract if possible.

```javascript
const finlib = require('./fincontracts-lib');
const exec = new finlib.Executor(marketplace, gateway, web3);
const id = '<32 byte address of a deployed Fincontract>';
try {
  const executed = await exec.join(id);
  console.log(JSON.stringify(executed));
} catch (err) {
  console.log(err);
}
```

### Parser

**Parser** can parse a String and return a Fincontract description, which then
can be [evaluated](#Evaluator) or [deployed](#Deployer).

```javascript
const finlib = require('./fincontracts-lib');
try {
  const p = new finlib.Parser();
  const expression = 'And(Give(Scale(11,One(USD))),Scale(10,One(EUR)))';
  const desc = await p.parse(expression);
} catch (err) {
  console.log(err);
}
```

### Serializer

**Serializer** can take a Fincontract and serialize it to String. It serializes,
all properties: `owner`, `issuer` and the `proposedOwner` as well as serializes
the Fincontract's description tree into String, which can be easily 
[parsed](#Parser)

```javascript
const finlib = require('./fincontracts-lib');
const srz = new finlib.Serializer();
const serialized = srz.serialize(fincontract);
console.log(JSON.stringify(serialized));
```

### DotGenerator

**DotGenerator** can take a Fincontract and generate a graph description in
DOT language, that can be piped into any DOT engine, which supports HTML labels.

```javascript
const finlib = require('./fincontracts-dot-generator');
const dg = new finlib.DotGenerator();
const dot = dg.generate(fincontract);
console.log(dot);
```
