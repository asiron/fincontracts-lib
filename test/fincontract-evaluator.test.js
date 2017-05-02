import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
chai.should();

import Currency from '../src/currency';
import Evaluator from '../src/fincontract-evaluator';
import * as finc from '../src/fincontract';

describe('Evaluator', function() {
  let evaluator;

  beforeEach(function() {
    evaluator = new Evaluator(null, null);
  });

  describe('#evaluate()', () => {
    it(`should correctly evaluate Fincontract's description with FincZeroNode`, function() {
      const description = new finc.FincZeroNode();
      const method = 'estimate';
      const evaluated = evaluator.evaluate(description, {method});
      return Promise.all([
        evaluated.should.eventually.be.an.Array,
        evaluated.should.eventually.have.lengthOf(6),
        evaluated.should.eventually.to.deep.equal([[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]])
      ]);
    });

    it(`should correctly evaluate complex Fincontract's description`, function() {
      const eur = Currency.getCurrencyIndex('EUR');
      const usd = Currency.getCurrencyIndex('USD');
      const one1 = new finc.FincOneNode(usd);
      const one2 = new finc.FincOneNode(eur);
      const scale1 = new finc.FincScaleNode(one1, 11);
      const scale2 = new finc.FincScaleNode(one2, 10);
      const give = new finc.FincGiveNode(scale1);
      const description = new finc.FincAndNode(give, scale2);
      const method = 'estimate';
      const evaluated = evaluator.evaluate(description, {method});
      return Promise.all([
        evaluated.should.eventually.be.an.Array,
        evaluated.should.eventually.have.lengthOf(6),
        evaluated.should.eventually.to.deep.equal([[-11, -11], [10, 10], [0, 0], [0, 0], [0, 0], [0, 0]])
      ]);
    });

    it(`should throw upon wrong evaluation method`, function() {
      const method = 'WRONGMETHOD';
      const err = 'Wrong evaluation method';
      return evaluator.evaluate(null, {method}).should.be.rejectedWith(Error, err);
    });
  });
});
