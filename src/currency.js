const rp = require('request-promise-native');

export const Currencies = {
  0 : 'USD', 
  1 : 'EUR'
}

const getKey = (obj,val) => Object.keys(obj).find(key => obj[key] === val);
export const getCurrencyIndex = (name) => getKey(Currencies, name);
export const currencyCount = Object.keys(Currencies).length;

const URL = 'http://api.fixer.io/latest';

const pullCurrencyExchangeRates = (base) =>
  rp({uri: URL+'?base'+base, json: true});

const changeAllCurrencies = (currrencies) => {
  pullCurrencyExchangeRates('USD').then((json) => {

  });
};