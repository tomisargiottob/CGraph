const { v4: uuid } = require('uuid');

class Wallet {
  constructor(db, logger) {
    this.db = db;
    this.collection = this.db.collection('wallet');
    this.logger = logger;
  }

  async getUserWallet(id) {
    try {
      // if (filter.limit) {
      // }
      const registersFetched = await this.collection.find({ userId: id });
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
