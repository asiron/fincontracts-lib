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
  jq '.alloc = { '\"${ACCOUNT}\"' : { "balance": "20000000000000000000" } }' genesis.json > modified_genesis.json
  geth "${GETH_PARAMS[@]}" init modified_genesis.json

  rm modified_genesis.json

  compile_contracts
}

function compile_contracts {
  mkdir -p $CONTRACT_BIN

  echo "Compiling contract..."
  $SOLC_HELPER \
    --contract FincontractMarketplace \
    --gas 5100000 \
    --value 0 \
    --output $CONTRACT_BIN/marketplace_deploy.js \
    contracts/fincontracts/marketplace.sol

  $SOLC_HELPER\
    --contract greeter \
    --gas 1000000 \
    --value 0 \
    --output $CONTRACT_BIN/greeter_deploy.js \
    contracts/examples/greeter.sol
}

function start {
  echo "Starting geth in background"
  nohup geth "${GETH_PARAMS[@]}" "${MINE_PARAMS[@]}" --unlock 0 --password $PASSWORD_FILE &> geth.log&
}

function create_instantiation_script {
  CONTRACT=$(basename $1 | cut -d_ -f1 )
  CONTRACT_ABI=${CONTRACT_BIN}/${CONTRACT}_deploy_abi.js
  CONTRACT_ABI_VAR=$(cat $CONTRACT_ABI | grep -o "\w*Compiled\w*")  
  CONTRACT_INST_VAR=$(echo ${CONTRACT_ABI_VAR} | sed 's/Compiled*//')
  CONTRACT_ABI_VAR=${CONTRACT_ABI_VAR}.${CONTRACT_INST_VAR}.abi
  CONTRACT_INST_SCRIPT=${CONTRACT_BIN}/${CONTRACT}_inst.js
  echo "var ${CONTRACT_INST_VAR} = eth.contract(${CONTRACT_ABI_VAR}).at(\"${2}\");" > $CONTRACT_INST_SCRIPT
  echo "Contract instantiation script created at ${CONTRACT_INST_SCRIPT}"
}

function deploy {
  compile_contracts

  echo "Deploying all contracts from $CONTRACT_BIN"
  for FILE in $CONTRACT_BIN/*_deploy.js; do
    
    ADDRESS=$(geth "${GETH_PARAMS[@]}" "${MINE_PARAMS[@]}" \
      --unlock 0 --password $PASSWORD_FILE \
      js $FILE  | grep "Contract mined! Address" | cut -d: -f2 )
    echo -e "\t Address is" $ADDRESS
    create_instantiation_script $FILE $ADDRESS
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
elif [[ $1 == "restart" ]]; then
  killall geth && start
elif [[ $1 == "stop" ]]; then
  killall geth
elif [[ $1 == "deploy" ]]; then
  deploy
fi
