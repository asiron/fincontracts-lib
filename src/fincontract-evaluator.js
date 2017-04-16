const finc = require('./fincontract');
const curr = require('./currency');
const sender = require('./tx-sender');
var log = require('minilog')('eval');
require('minilog').enable();

const gatewayjs = require('../contracts/bin/gateway.js');

const tupleMUL  = (i) => i[0] * i[1];
const zip       = (a1, a2) => a1.map((x, i) => [x, a2[i]]); 
const flatten   = (arr) => arr.reduce((a,b) => a.concat(b));
const cross     = (arr1, arr2) => arr1.map(a => arr2.map(b => [a,b]));
const makeArray = (size, obj) => Array.apply(null, Array(size)).map(_ => obj)

/*
 * TODO
   - include evaluation now and estimation
   - ScaleObs ranges should be applied here
   - now should call Gateways
   - pull currency exchange rates data and calculate single USD value 
   - return a dictionary 
 */

export class Evaluator {
  
  constructor(marketplace, web3) {
    this.marketplace = marketplace;
    this.web3 = web3;
  }

  evaluate(fincontract, options) {
    const that = this;
    const root = fincontract.rootDescription;

    if (options.method == 'now') {
      return this.updateAllGateways(root).then(
        Promise.resolve(that.eval(root, options.method))
      );

    } else if (options.method == 'estimate') {
      //IF nodes are now OR nodes
      //apply gateway ranges
      return Promise.resolve(this.eval(root, options.method));
    
    } else return Promise.reject('Wrong evaluation method')
  }

  eval(node, method) {



    switch (node.constructor) {

      case finc.FincAndNode: {
        const left  = this.eval(node.children[0]);
        const right = this.eval(node.children[1]);
        return zip(left,right).map( 
          ([iA, iB]) => [iA[0]+iB[0], iA[1]+iB[1]]
        );
      }

      case finc.FincIfNode: {
        const left  = this.eval(node.children[0]);
        const right = this.eval(node.children[1]);
        return zip(left,right).map( 
          ([iA, iB]) => [Math.min(iA[0], iB[0]), Math.max(iA[1], iB[1])]
        );
      } 

      case finc.FincOrNode: {
        const left  = this.eval(node.children[0]);
        const right = this.eval(node.children[1]);
        return zip(left,right).map( 
          ([iA, iB]) => [Math.min(iA[0], iB[0]), Math.max(iA[1], iB[1])]
        );
      }

      case finc.FincTimeboundNode:
        return this.eval(node.children).map(
          (i) => node.upperBound < Math.round(Date.now() / 1000) ? [0,0] : i
        );

      case finc.FincScaleObsNode: {
        // ????
        const range = [1, 1.2];
        return this.eval(node.children).map(
          (i) => {
            const a = flatten(cross(range, i)).map(tupleMUL);
            return [Math.min(...a), Math.max(...a)];
        });
      }

      case finc.FincScaleNode:
        return this.eval(node.children).map(
          (i) => [i[0]*node.scale, i[1]*node.scale]
        );
        
      case finc.FincGiveNode:
        return this.eval(node.children).map((i) => [-i[1], -i[0]]);


      case finc.FincOneNode: {
        const arr = makeArray(curr.currencyCount, [0,0]); 
        arr[node.currency] = [1,1];
        return arr;
      }

      case finc.FincZeroNode:
        return makeArray(curr.currencyCount, [0,0]);

      default: throw('Error: Unknown case during evaluation');
    }
  }

  updateAllGateways(node) {
    return Promise.all(this.visitGateway(node))
      .catch(e => log.error(e));
  }

  visitGateway(node) {
    if (node.children instanceof Array) {
      const left  = this.visitGateway(node.children[0]);
      const right = this.visitGateway(node.children[1]);
      const self  = this.updateGateway(node.gatewayAddress, 'If');
      return [...left, ...right, self];
    } else if (node.children) {
      const child = this.visitGateway(node.children);
      const self  = this.updateGateway(node.gatewayAddress, 'ScaleObs');
      return [...child, self];
    } else {
      return [Promise.resolve()];
    }
  }

  updateGateway(address, type) {
    if (!address) return [Promise.resolve()];
    const gateway = gatewayjs.Gateway(this.web3).at(address);
    const s = new sender.Sender(gateway, this.web3);
    const sent = s.send('update', [], {filter: 'latest'}, (logs) =>
      log.info('Finished! ' + type)).catch(e => log.warn(e));
    return [sent];
  }

  callGateway(address) {
    const gateway = gatewayjs.Gateway(this.web3).at(address);


  }

}
