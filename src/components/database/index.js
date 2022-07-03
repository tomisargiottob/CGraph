const { MongoClient } = require('mongodb');
const config = require('config');
const UserCollection = require('./collections/users');
const WalletCollection = require('./collections/wallet');
const MarketCollection = require('./collections/market');

class Database {
  constructor(logger) {
    this.logger = logger.child({ module: 'Database' });
    this.client = new MongoClient(config.mongodb.uri);
  }

  async connect() {
    this.db = await this.client.connect();
    this.dbo = this.db.db(config.mongodb.dbName);
    this.user = new UserCollection(this.dbo, this.logger);
    this.wallet = new WalletCollection(this.dbo, this.logger);
    this.market = new MarketCollection(this.dbo, this.logger);
    this.logger.info('Database connected succesfully');
  }
}

module.exports = Database;
