loadScript('contracts/bin/marketplace_deploy_abi.js');
loadScript('contracts/bin/marketplace_inst.js');

loadScript('lib/fincontract_factory.js')
loadScript('lib/fincontract.js')
loadScript('lib/utils.js')

console.log('Contract loaded!');

eth.defaultAccount = eth.coinbase;

var logResult = function(err, result) { console.log("Error:" + err + " Result:" + result) };

FincontractMarketplace.register.sendTransaction({}, logResult);

testFincontract   = null;
testFincontractId = null;

var createdByEvent = FincontractMarketplace.CreatedBy({}, function(err, result) {
  if (!err) {
    console.log("Fincontract: " 
      + result.args.fctId
      + "\nCreated for: " 
      + result.args.user
    );
    testFincontractId = result.args.fctId;
    testFincontract   = FincontractFactory.PullContract(result.args.fctId);
  } else
    console.log("Error when creating contract: " + err);
});

FincontractMarketplace.scaleObsTest.sendTransaction(0x0, {gas : 10000000}, logResult);

console.log('Done.');