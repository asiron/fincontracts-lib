loadScript('contracts/bin/marketplace_deploy_abi.js');
loadScript('contracts/bin/marketplace_inst.js');
loadScript('utils.js');

console.log('Contract loaded!');
eth.defaultAccount = eth.coinbase;

function Fincontract(issuer, owner, proposedOwner, dscId) {
  this.issuer = issuer;
  this.owner  = owner;
  this.proposedOwner = proposedOwner;
  this.dscId = dscId;
}

function FincontractNode(primitive, children)

{


}

var Currency = {
  USD  : 0,
  EUR  : 1,
  NONE : 2
}

var Primitive = {
  ZERO     : 0,
  ONE      : 1,
  GIVE     : 2,
  AND      : 3,
  OR       : 4,
  SCALEOBS : 5,
  IF       : 6,
  SCALE    : 7,
  ops : {
    0 : function ()       { return [0,0]; },
    1 : function ()       { return [1,1]; },
    2 : function (i)      { return [-i[1], -i[0]]; },
    3 : function (iA, iB) { return [iA[0]+iB[0], iA[1]+iB[1]]; },
    4 : function (iA, iB) { return [min(iA[0],iB[0]), max(iA[1]+iB[1])]; },
    5 : function (k, i)   { var a = zip(k,i).map(tupleMUL); return [a.min(), a.max()]; },
    6 : function (iA, iB) { return [min(iA[0],iB[0]), max(iA[1]+iB[1])]; },
    7 : function (k, i)   { return [k*i[0], k*i[1]]; }
  } 
};

var logResult = function(err, result) { console.log("Error:" + err + " Result:" + result) };

FincontractMarketplace.register.sendTransaction({}, logResult);

var testContract = null;
var createdByEvent = FincontractMarketplace.CreatedBy({}, function(err, result) {
  if (!err) {
    console.log("Fincontract: " 
      + result.args.fctId
      + "\nCreated for: " 
      + result.args.user
    );
    testContract = FincontractMarketplace.getFincontractInfo(result.args.fctId);
  } else
    console.log("Error when creating contract: " + err);
  
});

FincontractMarketplace.test.sendTransaction(0x0, {gas : 1000000}, logResult);

console.log('Done.');