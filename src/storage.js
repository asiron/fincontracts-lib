export default class Storage {

  static get IDS_CAT() { return 'ID'; }
  static get FINCONTRACTS_CAT() { return 'Fincontract'; }

  constructor(storage) {
    this.storage = storage;
  }

  getFromStorage(category) {
    return JSON.parse(this.storage.getItem(category)) || {}
  }

  addToStorage(category, key, value, overw) {
    const objects = this.getFromStorage(category);
    if (!overw && objects[key]) return false;
    objects[key] = value;
    this.storage.setItem(category, JSON.stringify(objects));
    return true;
  }

  addFincontract(name, fincontract, overw) {
    return this.addToStorage(Storage.FINCONTRACTS_CAT, name, fincontract, overw);
  }

  getFincontracts() {
    return this.getFromStorage(Storage.FINCONTRACTS_CAT);
  }

  getFincontractByName(name) {
    return this.getFincontracts()[name];
  }

  addFincontractID(id) {
    return typeof id === 'string' && this.addToStorage(Storage.IDS_CAT, id, true);
  }

  getFincontractIDs() {
    return Object.keys(this.getFromStorage(Storage.IDS_CAT));
  }
  
  wipe() {
    this.storage.removeItem(Storage.IDS_CAT);
    this.storage.removeItem(Storage.FINCONTRACTS_CAT);
  }
}