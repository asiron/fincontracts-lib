#!/bin/bash
# >>> requires `jq` for JSON modification <<<

VERBOSITY=4

DATA_DIR=`pwd`
GETH_PARAMS=(--identity "FincontractsTestNet" --maxpeers 0 --rpc --rpcport "8000" --rpccorsdomain "*" --datadir $DATA_DIR --port "30303" --nodiscover --ipcapi "admin,db,eth,debug,miner,net,shh,txpool,personal,web3" --rpcapi "db,eth,net,web3" --autodag --networkid 1900 --verbosity $VERBOSITY --nat "any")
MINE_PARAMS=(--mine --minerthreads 1)

function setup {
  echo "Setting up test blockchain"
  echo "Removing old blockchain data"
  rm -rf geth keystore
  geth "${GETH_PARAMS[@]}" init genesis.json

  echo "Creating an account"
  echo "testnet0" > testnet0.pass
  ACCOUNT="0x$(geth --datadir . --password testnet0.pass account new | cut -d "{" -f2 | cut -d "}" -f1)"

  echo "Allocating Ether..."
  jq '.alloc = { '\"${ACCOUNT}\"' : { "balance": "20000000000000000000" } }' genesis.json > tmp && mv tmp genesis.json
  geth "${GETH_PARAMS[@]}" init genesis.json
}

function start {
  echo "Starting geth in background"
  nohup geth "${GETH_PARAMS[@]}" "${MINE_PARAMS[@]}" --unlock 0 --password testnet0.pass &> geth.log&
}

if [[ $1 == "setup" ]]; then
  setup
  start
elif [[ $1 == "attach" ]]; then
  echo "Attaching to session..."
  geth "${GETH_PARAMS[@]}" attach ipc://$DATA_DIR/geth.ipc
elif [[ $1 == "start" ]]; then
  start
fi


