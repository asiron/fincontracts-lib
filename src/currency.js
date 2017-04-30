const rp = require('request-promise-native');

const URL = 'http://api.fixer.io/latest';
const getKey = (obj, val) => Object.keys(obj).find(key => obj[key] === val);
const pullCurrencyExchangeRates = base =>
  rp({uri: `${URL}?base=${base}`, json: true});

/**
 * Currencies as defined in:
 * {@link https://bitbucket.org/s-tikhomirov/fincontracts.git}
 *
 * @typedef {Object} Currencies
 * @property {Number} 0 USD (US Dollar)
 * @property {Number} 1 EUR (Euro)
 * @property {Number} 2 GBP (British Pound)
 * @property {Number} 3 JPY (Japanese Yen)
 * @property {Number} 4 CNY (Renminbi)
 * @property {Number} 5 SGD (Singapore Dollar)
 */
export const Currencies = {
  0: 'USD',
  1: 'EUR',
  2: 'GBP',
  3: 'JPY',
  4: 'CNY',
  5: 'SGD'
};

/**
 * Given a currency name in ISO 4217, return its index from {@link Currencies}
 * @param  {String} currency name in ISO 4217
 * @return {Number} index from {@link Currencies}
 */
export const getCurrencyIndex = currency => getKey(Currencies, currency);

/**
 * Number of defined currencies in {@link Currencies}
 * @type {Number}
 */
export const CURRENCYCOUNT = Object.keys(Currencies).length;

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
export async function changeAllCurrencies(base, currencies) {
  const exchanged = await pullCurrencyExchangeRates(base);
  const value = Object.values(currencies).reduce(([xA, xB], [yA, yB], i) => {
    const currency = Currencies[i];
    const scale = (currency === base) ? 1 : (1 / exchanged.rates[currency]);
    return [xA + (scale * yA), xB + (scale * yB)];
  }, [0, 0]);
  return {[base]: value};
}

/** 
 * Transforms an array of currency intervals to an object
 * with bases as keys and corresponding intervals as values
 * @param  {Array} currencyList an array of intervals in different currencies
 * @return {Object} transformed currencyList as object
 */
export function convertToJSON(currencyList) {
  return currencyList.reduce((object, item, index) => {
    object[Currencies[index]] = item;
    return object;
  }, {});
}
