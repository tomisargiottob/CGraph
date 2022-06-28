const MarketModel = require('../models/market');

class Market {
  constructor(db, logger) {
    this.db = db;
    this.collection = this.db.collection('market');
    this.logger = logger;
  }

  async getLastMarket() {
    try {
      this.logger.info('Searching for the last saved document');
      const market = await this.collection.find().sort({ createdAt: -1 }).limit(1).toArray();
      const lastMarket = new MarketModel(this.collection, market[0]);
      return lastMarket;
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }

  async addMarketData(marketId, data, createdAt) {
    try {
      this.logger.info('Saving market data');
      await this.collection.insertOne({ _id: marketId, prices: data, createdAt });
      return true;
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }
}

module.exports = Market;
