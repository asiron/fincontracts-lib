const rp = require('request-promise-native');

const URL = 'http://api.fixer.io/latest';
const getKey = (obj, val) => Object.keys(obj).find(key => obj[key] === val);

const pullCurrencyExchangeRates = base =>
  rp({uri: `${URL}?base=${base}`, json: true});

// HAS TO MATCH 'contracts/fincontracts/marketplace.sol'
export const Currencies = {
  0: 'USD',
  1: 'EUR',
  2: 'GBP',
  3: 'JPY',
  4: 'CNY',
  5: 'SGD'
};

export const getCurrencyIndex = name => getKey(Currencies, name);
export const currencyCount = Object.keys(Currencies).length;

export async function changeAllCurrencies(base, currencies) {
  const exchanged = await pullCurrencyExchangeRates(base);
  const value = Object.values(currencies).reduce(([xA, xB], [yA, yB], i) => {
    const currency = Currencies[i];
    const scale = (currency === base) ? 1 : (1 / exchanged.rates[currency]);
    return [xA + (scale * yA), xB + (scale * yB)];
  }, [0, 0]);
  return {[base]: value};
}

export function convertToJSON(currencyList) {
  return currencyList.reduce((object, item, index) => {
    object[Currencies[index]] = item;
    return object;
  }, {});
}
