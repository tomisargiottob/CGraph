const { v4: uuid } = require('uuid');

class Wallet {
  constructor(db, logger) {
    this.db = db;
    this.collection = this.db.collection('wallet');
    this.logger = logger;
  }

  async getUserWallet(id, where) {
    try {
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
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }

  async addUserRegister(id, data, createdAt, marketId) {
    try {
      // if (filter.limit) {
      // }
      await this.collection.insertOne({
        _id: uuid(),
        userId: id,
        wallet: data,
        marketId,
        createdAt,
      });
      return true;
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }
}

module.exports = Wallet;
