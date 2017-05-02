import chai from 'chai';
chai.should();

import Currency from '../src/currency';
import {default as DotGenerator, makeRandomIDFunc}
 from '../src/fincontract-dot-generator';
import * as finc from '../src/fincontract';

const expectedSimpleGraph = `digraph G {
\tsubgraph cluster_fincontract {

\t\tnode [style=filled, fillcolor="lightgrey", color="darkgreen"];
\t\tcolor=purple;
\t\tlabel = <
\t\t\t<table border="0" cellborder="1" cellspacing="0" cellpadding="4">
\t\t\t\t<tr >
\t\t\t\t\t<td colspan="2"><b>Fincontract</b></td>
\t\t\t\t</tr>
\t\t\t\t<tr>
\t\t\t\t\t<td align="center">ID:</td>
\t\t\t\t\t<td align="center">0x0</td>
\t\t\t\t</tr>
\t\t\t\t<tr>
\t\t\t\t\t<td align="center">Owner:</td>
\t\t\t\t\t<td align="center">0x0</td>
\t\t\t\t</tr>
\t\t\t\t<tr>
\t\t\t\t\t<td align="center">Issuer:</td>
\t\t\t\t\t<td align="center">0x0</td>
\t\t\t\t</tr>
\t\t\t\t<tr>
\t\t\t\t\t<td align="center">Proposed Owner:</td>
\t\t\t\t\t<td align="center">0x0</td>
\t\t\t\t</tr>
\t\t\t</table>
\t\t>
\t\tscale_1946176809757164 -> one_1599992113203115;
\t\tone_1599992113203115 [label="ONE EUR"];
\t\tscale_1946176809757164 [label="SCALE 10"];
\t}
}
`

const expectedComplexGraph = `digraph G {
\tsubgraph cluster_fincontract {

\t\tnode [style=filled, fillcolor="lightgrey", color="darkgreen"];
\t\tcolor=purple;
\t\tlabel = <
\t\t\t<table border="0" cellborder="1" cellspacing="0" cellpadding="4">
\t\t\t\t<tr >
\t\t\t\t\t<td colspan="2"><b>Fincontract</b></td>
\t\t\t\t</tr>
\t\t\t\t<tr>
\t\t\t\t\t<td align="center">ID:</td>
\t\t\t\t\t<td align="center">0x0</td>
\t\t\t\t</tr>
\t\t\t\t<tr>
\t\t\t\t\t<td align="center">Owner:</td>
\t\t\t\t\t<td align="center">0x0</td>
\t\t\t\t</tr>
\t\t\t\t<tr>
\t\t\t\t\t<td align="center">Issuer:</td>
\t\t\t\t\t<td align="center">0x0</td>
\t\t\t\t</tr>
\t\t\t\t<tr>
\t\t\t\t\t<td align="center">Proposed Owner:</td>
\t\t\t\t\t<td align="center">0x0</td>
\t\t\t\t</tr>
\t\t\t</table>
\t\t>
\t\tscale_1946176809757164 -> one_1599992113203115;
\t\tscaleobs_4729728905255131 -> scale_1946176809757164;
\t\tif_5856966491263613 -> scaleobs_4729728905255131;
\t\tscale_1573188492083005 -> one_5505134674395404;
\t\tgive_4884726994743814 -> scale_1573188492083005;
\t\tif_5856966491263613 -> give_4884726994743814;
\t\tand_6261215686561158 -> if_5856966491263613;
\t\tand_6261215686561158 -> one_5568118090751976;
\t\tor_3915134598778904 -> and_6261215686561158;
\t\tor_3915134598778904 -> zero_2584219579852201;
\t\ttimebound_6025664547789656 -> or_3915134598778904;
\t\tone_1599992113203115 [label="ONE EUR"];
\t\tscale_1946176809757164 [label="SCALE 5"];
\t\tscaleobs_4729728905255131 [label="SCALEOBS 0xabcdef"];
\t\tif_5856966491263613 [label="IF 0x0"];
\t\tone_5505134674395404 [label="ONE USD"];
\t\tscale_1573188492083005 [label="SCALE 7"];
\t\tgive_4884726994743814 [label="GIVE"];
\t\tand_6261215686561158 [label="AND"];
\t\tone_5568118090751976 [label="ONE CNY"];
\t\tor_3915134598778904 [label="OR"];
\t\tzero_2584219579852201 [label="ZERO"];
\t\ttimebound_6025664547789656 [label="TIMEBOUND\\n01/01/1970, 01:00:01\\n01/01/1970, 01:01:40"];
\t}
}
`

describe('DotGenerator', function() {
  let dotGenerator;

  beforeEach(function() {
    const seedrandom = require('seedrandom');
    const rng = seedrandom(1);
    dotGenerator = new DotGenerator();
    dotGenerator.dgv.randomID = makeRandomIDFunc(rng);
  });

  describe('#evaluate()', function() {
    
    it(`should correctly generate a DOT graph for a Fincontract with a simple description`, function() {
      const one = new finc.FincOneNode(1);
      const scale = new finc.FincScaleNode(one, 10);
      const fincontract = new finc.Fincontract({
        id: '0x000000000000',
        owner: '0x000000',
        issuer: '0x000',
        proposedOwner: '0x0000',
        rootDescription: scale
      });
      const graph = dotGenerator.generate(fincontract);
      graph.should.be.equal(expectedSimpleGraph);
    });

    it(`should correctly generate a DOT graph for a Fincontract with a complex description`, function() {
      const eur = Currency.getCurrencyIndex('EUR');
      const usd = Currency.getCurrencyIndex('USD');
      const cny = Currency.getCurrencyIndex('CNY');
      
      const zero1 = new finc.FincZeroNode();
      const one1 = new finc.FincOneNode(eur);
      const one2 = new finc.FincOneNode(usd);
      const one3 = new finc.FincOneNode(cny);
      const scale1 = new finc.FincScaleNode(one1, 5);
      const scale2 = new finc.FincScaleNode(one2, 7);
      const scaleObs1 = new finc.FincScaleObsNode(scale1, '0xabcdef');
      const give1 = new finc.FincGiveNode(scale2);
      const if1 = new finc.FincIfNode(scaleObs1, give1, '0x000000');
      const and = new finc.FincAndNode(if1, one3);
      const or = new finc.FincOrNode(and, zero1);
      const timebound = new finc.FincTimeboundNode(or, 1, 100);
      const fincontract = new finc.Fincontract({
        id: '0x000000000000',
        owner: '0x000000',
        issuer: '0x000',
        proposedOwner: '0x0000',
        rootDescription: timebound
      });
      const graph = dotGenerator.generate(fincontract);
      graph.should.be.equal(expectedComplexGraph);
    });
  });
});
