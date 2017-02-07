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

### Installing

Initialize submodules and pull them by running from the root of this repository

```
git submodule init
git submodule update --recursive --remote
```

Compile ES6 scripts to ES5 by


