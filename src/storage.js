class Storage {

  constructor(storage) {
    this.storage = storage;
  }

  getFromStorage(category) {
    return JSON.parse(this.storage.getItem(category)) || {};
  }

  addToStorage(category, key, value, overw) {
    const objects = this.getFromStorage(category);
    if (!overw && objects[key]) {
      return false;
    }
    objects[key] = value;
    this.storage.setItem(category, JSON.stringify(objects));
    return true;
  }

}

export default class FincontractStorage extends Storage {

  static get IDS_CAT() {
    return 'ID';
  }

  static get FINCONTRACTS_CAT() {
    return 'Fincontract';
  }

  addFincontract(name, fincontract, overw) {
    return this.addToStorage(
      FincontractStorage.FINCONTRACTS_CAT,
      name,
      fincontract,
      overw
    );
  }

  getFincontracts() {
    return this.getFromStorage(FincontractStorage.FINCONTRACTS_CAT);
  }

  getFincontractByName(name) {
    return this.getFincontracts()[name];
  }

  addFincontractID(id) {
    return typeof id === 'string' &&
      this.addToStorage(FincontractStorage.IDS_CAT, id, true);
  }

  getFincontractIDs() {
    return Object.keys(this.getFromStorage(FincontractStorage.IDS_CAT));
  }

  wipe() {
    this.storage.removeItem(FincontractStorage.IDS_CAT);
    this.storage.removeItem(FincontractStorage.FINCONTRACTS_CAT);
  }
}
