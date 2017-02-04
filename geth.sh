#!/bin/bash
# >>> requires `jq` for JSON modification <<<

VERBOSITY=4

PASSWORD=testnet0
PASSWORD_FILE=testnet0.pass

DATA_DIR=`pwd`
GETH_PARAMS=(--identity "FincontractsTestNet" --maxpeers 0 --rpc --rpcport "8000" --rpccorsdomain "*" --datadir $DATA_DIR --port "30303" --nodiscover --ipcapi "admin,db,eth,debug,miner,net,shh,txpool,personal,web3" --rpcapi "db,eth,net,web3" --autodag --networkid 1900 --verbosity $VERBOSITY --nat "any")
MINE_PARAMS=(--mine --minerthreads 1)

SOLC_HELPER=contracts/solc_helper/solc_helper
CONTRACT_BIN=contracts/bin

function setup {
  echo "Setting up test blockchain"
  echo "Removing old blockchain data"
  rm -rf geth keystore
  geth "${GETH_PARAMS[@]}" init genesis.json

  echo "Creating an account"
  echo $PASSWORD > $PASSWORD_FILE
  ACCOUNT="0x$(geth --datadir . --password $PASSWORD_FILE account new | cut -d "{" -f2 | cut -d "}" -f1)"

  echo "Allocating Ether..."
  jq '.alloc = { '\"${ACCOUNT}\"' : { "balance": "20000000000000000000" } }' genesis.json > tmp && mv tmp genesis.json
  geth "${GETH_PARAMS[@]}" init genesis.json

  mkdir -p $CONTRACT_BIN

  echo "Compiling contract..."
  $SOLC_HELPER \
    --contract FincontractMarketplace \
    --gas 5100000 \
    --value 0 \
    --output $CONTRACT_BIN/marketplace_compiled.js \
    contracts/fincontracts/marketplace.sol

  $SOLC_HELPER\
    --contract greeter \
    --gas 100000 \
    --value 0 \
    --output $CONTRACT_BIN/greeter_compiled.js \
    contracts/examples/greeter.sol

}

function start {
  echo "Starting geth in background"
  nohup geth "${GETH_PARAMS[@]}" "${MINE_PARAMS[@]}" --unlock 0 --password $PASSWORD_FILE &> geth.log&
}

function deploy {
  echo "Deploying all contracts from $CONTRACT_BIN"
  for file in $CONTRACT_BIN/*; do
    echo "Deploying " $file
    geth "${GETH_PARAMS[@]}" "${MINE_PARAMS[@]}" --unlock 0 --password $PASSWORD_FILE js $file
  done
}

if [[ $1 == "setup" ]]; then
  setup
  deploy
  start
elif [[ $1 == "attach" ]]; then
  echo "Attaching to session..."
  geth "${GETH_PARAMS[@]}" attach ipc://$DATA_DIR/geth.ipc
elif [[ $1 == "start" ]]; then
  start
elif [[ $1 == "deploy" ]]; then
  deploy
fi


