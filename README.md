# fincontract-client
Copyright (C) 2017 - Maciej Żurad, University of Luxembourg

Client for managing financial contracts deployed on the Ethereum blockchain.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

You will need the following software:

- jq  [1.5]
- npm [3.9.5]
- nodejs [v6.2.2]
- geth [1.5.7]

You can install `npm` and `nodejs` from  [nodejs.org](https://nodejs.org/en/download/) or if you're on Mac OS X with `brew` simply run

```
brew install node
```

For installing `geth` follow instructions from [github.com/ethereum/go-ethereum](https://github.com/ethereum/go-ethereum/wiki/Building-Ethereum)
Last but not least, you can install need `jq` on:

- Debian/Ubuntu `sudo apt-get install jq`
- Mac OS X `brew install jq`

### Installing and Building

Initialize submodules and pull them by running from the root of this repository

```
git submodule init
git submodule update
```

Install all node dependecies and compile ES6 scripts to ES5 using
```
npm install
npm run build
```

### Usage

#### Setup
 If you want to setup the private blockchain, allocate some ether at the beginning, compile and deploy contracts to it (might take a while):
```
./blockchain setup
```
The blockchain will be running in the background after initialization.
#### Deploy
 If you just want to deploy contracts, then run:
```
./blockchain deploy
```
Blockchain has to be initialized (using `./blockchain setup`) and cannot be running in the background.

#### Stop, Start, Restart and Attach
You can also stop, start, restart and attach to the current session.
```
./blockchain stop
./blockchain start
./blockchain restart
./blockchain attach
```

### Retrieving Financial Contracts from the blockchain and analyzing them.
Once you have attached to the blockchain, you should see Java Script console. Run `loadScript('lib/fetch_fincontracts.js')` in order to fetch a test Fincontract. Once the transaction was mined, you should see message:
```
Fincontract: <fctId>
Created for: <user_address>
```
You can then use variable to `testFincontract` to view the contract. Furthemore, you can run `testFincontract.rootDescription.eval()` to see the evaluation of the financial contract.

### Development

Remember to deploy contracts if you have changed Solidity contracts from `contracts/` directory and remember to run `npm run build` if you changed any of the JavaScript source files form `src`, you will have to reload the scripts as well in JS console.



