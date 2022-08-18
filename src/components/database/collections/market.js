const MarketModel = require('../models/market');

class Market {
  constructor(db) {
    this.db = db;
    this.collection = this.db.collection('market');
  }

  async getLastMarket() {
    const market = await this.collection.find().sort({ createdAt: -1 }).limit(1).toArray();
    if (!market) {
      return false;
    }
    const lastMarket = new MarketModel(this.collection, market[0]);
    return lastMarket;
  }

  async addMarketData(marketId, data, createdAt) {
    await this.collection.insertOne({ _id: marketId, prices: data, createdAt });
    return true;
  }
}

module.exports = Market;
