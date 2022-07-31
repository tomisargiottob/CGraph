const StaticCryptoModel = require('../models/staticCrypto');

class StaticCryptos {
  constructor(db) {
    this.db = db;
    this.collection = this.db.collection('staticCrypto');
  }

  async findUserStaticCryptos(userId) {
    const staticCryptos = await this.collection.find({ userId }).toArray();
    return staticCryptos.map((crypto) => new StaticCryptoModel(this.collection, crypto));
  }

  async findStaticCryptoById(id, userId) {
    const staticCrypto = await this.collection.findOne({ _id: id, userId });
    if (staticCrypto) {
      return new StaticCryptoModel(this.collection, staticCrypto);
    }
    return staticCrypto;
  }

  async addStaticCrypto(staticCrypto) {
    // eslint-disable-next-line no-param-reassign
    staticCrypto.createdAt = Date.now();
    await this.collection.insertOne(staticCrypto);
  }
}

module.exports = StaticCryptos;
