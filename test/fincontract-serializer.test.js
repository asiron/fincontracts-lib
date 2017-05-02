import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
chai.should();

import Currency from '../src/currency';
import Serializer from '../src/fincontract-serializer';
import * as finc from '../src/fincontract';

describe('Serializer', () => {
  let serializer;

  beforeEach(() => {
    serializer = new Serializer();
  });

  describe('#serialize()', () => {
    it('should correctly serialize Fincontract with FincZeroNode', () => {
      const zero = new finc.FincZeroNode();
      const fincontract = new finc.Fincontract({
        id: '0x000000000000',
        owner: '0x000000',
        issuer: '0x000',
        proposedOwner: '0x0000',
        rootDescription: zero
      });
      const serialized = serializer.serialize(fincontract);
      serialized.should.have.property('id').which.is.equal('0x0');
      serialized.should.have.property('owner').which.is.equal('0x0');
      serialized.should.have.property('issuer').which.is.equal('0x0');
      serialized.should.have.property('proposedOwner').which.is.equal('0x0');
      serialized.should.have.property('description').which.is.equal('Zero()');
    });

    it('should correctly serialize Fincontract with complex Fincontract', () => {
      const zero1 = new finc.FincZeroNode();

      const eur = Currency.getCurrencyIndex('EUR');
      const usd = Currency.getCurrencyIndex('USD');
      const cny = Currency.getCurrencyIndex('CNY');

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

      const expectedDescription =
      'Timebound(1,100,Or(And(If(0x0,' +
      'ScaleObs(0xabcdef,Scale(5,One(EUR))),' +
      'Give(Scale(7,One(USD)))),One(CNY)),Zero()))';

      const fincontract = new finc.Fincontract({
        id: '0xabcd',
        owner: '0xabcd',
        issuer: '0xabcd',
        proposedOwner: '0xabcd',
        rootDescription: timebound
      });
      const serialized = serializer.serialize(fincontract);
      serialized.should.have.property('id').which.is.equal('0xabcd');
      serialized.should.have.property('owner').which.is.equal('0xabcd');
      serialized.should.have.property('issuer').which.is.equal('0xabcd');
      serialized.should.have.property('proposedOwner').which.is.equal('0xabcd');
      serialized.should.have.property('description').which.is.equal(expectedDescription);
    });
  });
});
