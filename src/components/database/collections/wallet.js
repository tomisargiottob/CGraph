const { v4: uuid } = require('uuid');

class Wallet {
  constructor(db) {
    this.db = db;
    this.collection = this.db.collection('wallet');
  }

  async getUserWallet(id, where) {
    const filter = { createdAt: {} };
    let today;
    let pastDate;
    if (!where) {
      today = new Date();
      pastDate = today.setMonth(today.getMonth() - 3);
    }
    filter.createdAt.$gt = Number(where.createdAt.gt) || pastDate.getTime();
    filter.createdAt.$lt = Number(where.createdAt.lt) || today.getTime();
    const registersFetched = await this.collection.find({ userId: id, ...filter }).toArray();
    return registersFetched;
  }

  async addUserRegister(id, data, marketId) {
    await this.collection.insertOne({
      _id: uuid(),
      userId: id,
      wallet: data,
      marketId,
      createdAt: Date.now(),
    });
    return true;
  }
}

module.exports = Wallet;
