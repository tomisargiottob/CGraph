/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const errors = require('common-errors');
const Binance = require('./intefaces/binance');
const StaticCrypto = require('./intefaces/staticCrypto');

class ConnectorManager {
  constructor(logger, db, encryptor) {
    this.logger = logger.child({ module: 'ConnectorManager' });
    this.db = db;
    this.binance = new Binance(logger);
    this.staticCrypto = new StaticCrypto(logger, db);
    this.encryptor = encryptor;
  }

  addAssetValue(marketData, crypto, wallet) {
    if (marketData[crypto.asset]) {
      const individualValue = (crypto.amount) * marketData[crypto.asset];
      wallet.assets.push({ coin: crypto.asset, value: individualValue, amount: crypto.amount });
      return individualValue;
    }
    if (crypto.amount > 0) {
      this.logger.info(`missing price for ${crypto.asset}`);
    }
    return 0;
  }

  async findMissingAssetPrice(marketData, wallet, apiKey, apiSecret) {
    const missingAssets = wallet.assets.reduce((missing, crypto) => {
      if (!marketData[crypto.asset] && crypto.amount > 0) {
        missing.push(crypto.asset);
      }
      return missing;
    }, []);
    for (const asset of missingAssets) {
      this.logger.info(`Price not registered for ${asset}, searching for price`);
      try {
        // eslint-disable-next-line no-param-reassign
        marketData[asset] = await this.getTickerPrice(
          crypto.asset,
          wallet.account,
          apiKey,
          apiSecret,
        );
        this.logger.info(`Price found for ${asset}, adding to memory. Price of ${marketData[asset]}`);
      } catch (err) {
        this.logger.warn(`Price not found for ${asset}, ${err.message}`);
      }
    }
  }

  getTickerPrice(ticker, account, apiKey, apiSecret) {
    if (account === 'binance') {
      return this.binance.getTickerPrice(ticker, apiKey, apiSecret);
    }
    throw new errors.NotFoundError('Ticker');
  }

  async saveWalletStatus(market, key, user) {
    let walletStatus;
    let value = 0;
    const wallet = { assets: [], value: 0, account: key.account };
    if (key.account === 'static') {
      walletStatus = await this.staticCrypto.getWalletStatus(user.id);
    } else {
      const apiKey = await this.encryptor.decrypt(key.apiKey);
      const apiSecret = await this.encryptor.decrypt(key.apiSecret);
      if (key.account === 'binance') {
        walletStatus = await this.binance.getWalletStatus({ apiKey, apiSecret });
      } else if (key.account === 'kucoin') {
        this.logger.warn('Interface not developed yet');
      } else {
        this.logger.error('Interface not recognized');
      }
      if (walletStatus) {
        // console.log(walletStatus, wallet)
        await this.findMissingAssetPrice(market.data, wallet, apiKey, apiSecret);
        // eslint-disable-next-line no-restricted-syntax
      } else {
        this.logger.error('Could not fetch account information, desactivating apiKey');
        await key.updateApiKey('inactive');
      }
    }
    if (walletStatus.length > 0) {
      for (const crypto of walletStatus) {
        if (crypto.amount > 0) {
          // eslint-disable-next-line no-await-in-loop
          value += await this.addAssetValue(market.data, crypto, wallet);
        }
      }
      wallet.value = value;
      this.logger.info('Saving wallet information in database');
      await this.db.wallet.addUserRegister(user.id, wallet, market.id);
    } else {
      this.logger.info(`No cryptos registered in ${user.username} ${key.account} account`);
    }
  }
}

module.exports = ConnectorManager;
