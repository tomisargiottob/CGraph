const { MongoClient } = require('mongodb');
const config = require('config');
const UserCollection = require('./collections/users');
const WalletCollection = require('./collections/wallet');
const MarketCollection = require('./collections/market');
const logger = require('../logger/logger');

class Database {
  constructor() {
    this.client = new MongoClient(config.mongodb.uri);
  }

  async connect() {
    this.db = await this.client.connect();
    this.dbo = this.db.db(config.mongodb.dbName);
    this.user = new UserCollection(this.dbo, logger);
    this.wallet = new WalletCollection(this.dbo, logger);
    this.market = new MarketCollection(this.dbo, logger);
    logger.info('Database connected succesfully');
  }
}

module.exports = Database;
