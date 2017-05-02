import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
chai.should();

import Currency from '../src/currency';
import Parser from '../src/fincontract-parser';
import * as finc from '../src/fincontract';

describe('Parser', () => {
  let parser;

  beforeEach(() => {
    parser = new Parser();
  });

  describe('#parse()', () => {
    it('should correctly parse Zero()', () => {
      const string = 'Zero()';
      const parsed = parser.parse(string);
      return Promise.all([
        parsed.should.eventually.be.fulfilled,
        parsed.should.eventually.be.an.instanceOf(finc.FincZeroNode),
        parsed.should.eventually.have.property('children').which.is.null
      ]);
    });

    it('should correctly parse One(AAA)', () => {
      const string = 'One(AAA)';
      const err = 'Currency not defined!';
      return parser.parse(string).should.be.rejectedWith(Error, err);
    });

    it('should correctly parse One(EUR)', () => {
      const string = 'One(EUR)';
      const currIndex = Currency.getCurrencyIndex('EUR');
      const parsed = parser.parse(string);
      return Promise.all([
        parsed.should.eventually.be.fulfilled,
        parsed.should.eventually.be.an.instanceOf(finc.FincOneNode),
        parsed.should.eventually.have.property('children').which.is.null,
        parsed.should.eventually.have.property('currency').which.is.currIndex
      ]);
    });

    it('should correctly parse Scale(-5,One(GBP))', () => {
      const string = 'Scale(-5,One(GBP))';
      const currIndex = Currency.getCurrencyIndex('GBP');
      const parsed = parser.parse(string);
      return Promise.all([
        parsed.should.eventually.be.fulfilled,
        parsed.should.eventually.be.an.instanceOf(finc.FincScaleNode),
        parsed.should.eventually.have.property('scale').which.is.equal(-5),
        parsed.should.eventually.have.property('children').which.is.an.instanceOf(finc.FincOneNode),
        parsed.should.eventually.have.deep.property('children.currency').which.is.equal(currIndex)
      ]);
    });

    it('should correctly parse ScaleObs(0x0000000,Zero())', () => {
      const string = 'ScaleObs(0x0000000,Zero())';
      const parsed = parser.parse(string);
      return Promise.all([
        parsed.should.eventually.be.fulfilled,
        parsed.should.eventually.be.an.instanceOf(finc.FincScaleObsNode),
        parsed.should.eventually.have.property('gatewayAddress').which.is.equal('0x0'),
        parsed.should.eventually.have.property('children').which.is.an.instanceOf(finc.FincZeroNode)
      ]);
    });

    it('should correctly parse If(0xabcdef,Zero(),Zero())', () => {
      const string = 'If(0xabcdef,Zero(),Zero())';
      const parsed = parser.parse(string);
      return Promise.all([
        parsed.should.eventually.be.fulfilled,
        parsed.should.eventually.be.an.instanceOf(finc.FincIfNode),
        parsed.should.eventually.have.property('gatewayAddress').which.is.equal('0xabcdef'),
        parsed.should.eventually.have.deep.property('children[0]').which.is.an.instanceOf(finc.FincZeroNode),
        parsed.should.eventually.have.deep.property('children[1]').which.is.an.instanceOf(finc.FincZeroNode)
      ]);
    });

    it('should correctly parse Give(One(SGD))', () => {
      const string = 'Give(One(SGD))';
      const currIndex = Currency.getCurrencyIndex('SGD');
      const parsed = parser.parse(string);
      return Promise.all([
        parsed.should.eventually.be.fulfilled,
        parsed.should.eventually.be.an.instanceOf(finc.FincGiveNode),
        parsed.should.eventually.have.property('children').which.is.an.instanceOf(finc.FincOneNode),
        parsed.should.eventually.have.deep.property('children.currency').which.is.currIndex
      ]);
    });

    it('should correctly parse And(Timebound(0,10,One(JPY)),Scale(10,One(CNY)))', () => {
      const string = 'And(Timebound(0,10,One(JPY)),Scale(10,One(CNY)))';
      const currIndexJPY = Currency.getCurrencyIndex('JPY');
      const currIndexCNY = Currency.getCurrencyIndex('CNY');

      return parser.parse(string).then(parsed => {
        parsed.should.be.an.instanceOf(finc.FincAndNode);
        parsed.should.have.property('children').which.is.an.Array;

        const first = parsed.children[0];
        const second = parsed.children[1];

        first.should.be.an.instanceOf(finc.FincTimeboundNode);
        first.should.have.property('lowerBound').which.is.equal(0);
        first.should.have.property('upperBound').which.is.equal(10);
        first.should.have.property('children').which.is.not.null;
        first.children.should.be.an.instanceOf(finc.FincOneNode);
        first.children.should.have.property('currency').which.is.currIndexJPY;
        first.children.should.have.property('children').which.is.null;

        second.should.be.an.instanceOf(finc.FincScaleNode);
        second.should.have.property('children').which.is.not.null;
        second.should.have.property('scale').which.is.equal(10);
        second.children.should.be.an.instanceOf(finc.FincOneNode);
        second.children.should.have.property('currency').which.is.currIndexCNY;
        second.children.should.have.property('children').which.is.null;
      });
    });

    it('should throw syntax error on Zero())', () => {
      const string = 'Zero())';
      return parser.parse(string).should.be.rejectedWith(SyntaxError);
    });

    it('should throw Error on unknown node type: Zeroo()', () => {
      const string = 'Zeroo()';
      const err = 'Unknown case during parsing';
      return parser.parse(string).should.be.rejectedWith(Error, err);
    });
  });
});
