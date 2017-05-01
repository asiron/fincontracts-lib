'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var rp = require('request-promise-native');

var URL = 'http://api.fixer.io/latest';
var getKey = function getKey(obj, val) {
  return Object.keys(obj).find(function (key) {
    return obj[key] === val;
  });
};
var pullCurrencyExchangeRates = function pullCurrencyExchangeRates(base) {
  return rp({ uri: URL + '?base=' + base, json: true });
};

/**
 * Currencies as defined in:
 * {@link https://bitbucket.org/s-tikhomirov/fincontracts.git}
 *
 * @typedef {Object} CurrenciesType
 * @property {Number} 0 USD (US Dollar)
 * @property {Number} 1 EUR (Euro)
 * @property {Number} 2 GBP (British Pound)
 * @property {Number} 3 JPY (Japanese Yen)
 * @property {Number} 4 CNY (Renminbi)
 * @property {Number} 5 SGD (Singapore Dollar)
 */

/**
 * {@link Currency} class describes supported currencies as well as operations
 * on them, such as mapping from and to a Currency index as well as exchanging
 * a list of interval in different currencies to a single base for evaluation.
 */

var Currency = function () {
  function Currency() {
    _classCallCheck(this, Currency);
  }

  _createClass(Currency, null, [{
    key: 'getCurrencyIndex',


    /**
     * Given a currency name in ISO 4217, return its index from {@link Currencies}
     * @param  {String} currency name in ISO 4217
     * @return {Number} index from {@link Currencies}
     */
    value: function getCurrencyIndex(currency) {
      return getKey(Currency.Currencies, currency);
    }

    /**
     * Takes a currency base in ISO 4217 and a list of intervals
     * in different currencies and transforms all to the specified base
     * using http://fixer.io API
     *
     * @param  {String} base a string specifiying currency from {@link Currencies}
     * @param  {Array} currencies an array of intervals in different currencies
     * @return {Object} object with selected base as key
     *  and the calculated interval as value
     */

  }, {
    key: 'changeAllCurrencies',
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(base, currencies) {
        var exchanged, value;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return pullCurrencyExchangeRates(base);

              case 2:
                exchanged = _context.sent;
                value = Object.values(currencies).reduce(function (_ref2, _ref3, i) {
                  var _ref5 = _slicedToArray(_ref2, 2),
                      xA = _ref5[0],
                      xB = _ref5[1];

                  var _ref4 = _slicedToArray(_ref3, 2),
                      yA = _ref4[0],
                      yB = _ref4[1];

                  var currency = Currency.Currencies[i];
                  var scale = currency === base ? 1 : 1 / exchanged.rates[currency];
                  return [xA + scale * yA, xB + scale * yB];
                }, [0, 0]);
                return _context.abrupt('return', _defineProperty({}, base, value));

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function changeAllCurrencies(_x, _x2) {
        return _ref.apply(this, arguments);
      }

      return changeAllCurrencies;
    }()

    /**
     * Transforms an array of currency intervals to an object
     * with bases as keys and corresponding intervals as values
     * @param  {Array} currencyList an array of intervals in different currencies
     * @return {Object} transformed currencyList as object
     */

  }, {
    key: 'convertToJSON',
    value: function convertToJSON(currencyList) {
      return currencyList.reduce(function (object, item, index) {
        object[Currency.Currencies[index]] = item;
        return object;
      }, {});
    }
  }, {
    key: 'Currencies',


    /**
     * Supported currencies as described in {@link CurrenciesType}.
     * @type {CurrenciesType}
     */
    get: function get() {
      return {
        0: 'USD',
        1: 'EUR',
        2: 'GBP',
        3: 'JPY',
        4: 'CNY',
        5: 'SGD'
      };
    }

    /**
     * Number of defined currencies in {@link Currencies}
     * @type {Number}
     */

  }, {
    key: 'CurrencyCount',
    get: function get() {
      return Object.keys(Currency.Currencies).length;
    }
  }]);

  return Currency;
}();

exports.default = Currency;