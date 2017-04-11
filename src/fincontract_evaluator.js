//import * as u from 'utils';

const finc = require('./fincontract');

let tupleMUL  = (i) => i[0] * i[1];
let zip       = (a1, a2) => a1.map((x, i) => [x, a2[i]]); 
let flatten   = (arr) => arr.reduce((a,b) => a.concat(b));
let cross     = (arr1,arr2) => arr1.map(a => arr2.map(b => [a,b]));
let makeArray = (size, obj) => Array.apply(null, Array(size)).map(_ => obj)

var currencyCount = Object.keys(finc.Currencies).length

/*
 * TODO
   - include evaluation now and estimation
   - ScaleObs ranges should be applied here
   - now should call Gateways
   - pull currency exchange rates data and calculate single USD value 
 *
 */

export class Evaluator {
  
  constructor() {}

  visit(node) {

    switch (node.constructor) {

      case finc.FincAndNode: {
        let left  = this.visit(node.children[0]);
        let right = this.visit(node.children[1]);
        return zip(left,right).map( 
          ([iA, iB]) => [iA[0]+iB[0], iA[1]+iB[1]]
        );
      }

      case finc.FincIfNode: {
        let left  = this.visit(node.children[0]);
        let right = this.visit(node.children[1]);
        return zip(left,right).map( 
          ([iA, iB]) => [Math.min(iA[0], iB[0]), Math.max(iA[1], iB[1])]
        );
      } 

      case finc.FincOrNode: {
        let left  = this.visit(node.children[0]);
        let right = this.visit(node.children[1]);
        return zip(left,right).map( 
          ([iA, iB]) => [Math.min(iA[0], iB[0]), Math.max(iA[1], iB[1])]
        );
      }

      case finc.FincTimeboundNode:
        return this.visit(node.children).map(
          (i) => node.upperBound < Math.round(Date.now() / 1000) ? [0,0] : i
        );

      case finc.FincScaleObsNode:
        return this.visit(node.children).map(
          (i) => {
            let a = flatten(cross(node.range,i)).map(tupleMUL);
            return [Math.min(...a), Math.max(...a)];
        });

      case finc.FincScaleNode:
        return this.visit(node.children).map(
          (i) => [i[0]*node.scale, i[1]*node.scale]
        );
        
      case finc.FincGiveNode:
        return this.visit(node.children).map((i) => [-i[1], -i[0]]);


      case finc.FincOneNode: {
        let arr = makeArray(currencyCount, [0,0]); 
        arr[node.currency] = [1,1];
        return arr;
      }

      case finc.FincZeroNode:
        return makeArray(currencyCount, [0,0]);

      default:
        console.log('Error');
    }
  }
}
