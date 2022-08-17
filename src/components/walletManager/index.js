/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const errors = require('common-errors');
const Binance = require('./connectors/binance');
const Kucoin = require('./connectors/kucoin');
const StaticCrypto = require('./connectors/staticCrypto');

class ConnectorManager {
  constructor({ logger, db, encryptor }, config) {
    this.logger = logger.child({ module: 'ConnectorManager' });
    this.db = db;
    this.binance = new Binance({ logger });
    this.kucoin = new Kucoin({ logger }, config.get('kucoin'));
    this.staticCrypto = new StaticCrypto({ logger, db });
    this.encryptor = encryptor;
  }

  addAssetValue(marketData, crypto, wallet) {
    if (marketData[crypto.asset]) {
      const individualValue = (crypto.amount) * marketData[crypto.asset];
      wallet.assets.push({ coin: crypto.asset, value: individualValue, amount: crypto.amount });
      return individualValue;
    }
    if (crypto.amount > 0) {
      this.logger.info(`Missing price for ${crypto.asset}`);
    }
    return 0;
  }

  checkApiKey({
    apiKey,
    apiSecret,
    passphrase,
    account,
  }) {
    return this[account].checkApiKey({ apiKey, apiSecret, passphrase });
  }

  async findMissingAssetPrice(marketData, wallet, account, key) {
    const missingAssets = wallet.reduce((missing, crypto) => {
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
          asset,
          account,
          key,
        );
        this.logger.info(`Price found for ${asset}, adding to memory. Price of ${marketData[asset]}`);
      } catch (err) {
        this.logger.warn(`Price not found for ${asset}, ${err.message}`);
      }
    }
  }

  async calculateUserWallet(user, market) {
    const userApiKeys = await this.db.apiKey.getUserApiKeys(user.id, { status: 'active' });
    const balance = await this.db.staticCrypto.findUserStaticCryptos(user.id);
    if (!userApiKeys.length && balance.length === 0) {
      this.logger.info(`Skiping ${user.username} as it has not registered apiKeys or static cryptos`);
    } else {
      const wallet = await this.db.wallet.createWallet(user.id, market.id);
      for (const key of userApiKeys) {
        this.logger.info(`Fetching user ${user.username} wallet information of ${key.account}`);
        await this.saveAccountStatus(market, key, user, wallet);
      }
      if (balance.length) {
        this.logger.info(`Fetching user ${user.username} static Crypto wallet information`);
        await this.saveAccountStatus(market, { account: 'static' }, user, wallet);
      }
    }
  }

  getTickerPrice(ticker, account, key) {
    if (account === 'binance') {
      return this.binance.getTickerPrice(ticker, key);
    }
    throw new errors.NotFoundError('Ticker');
  }

  async saveAccountStatus(market, key, user, wallet) {
    let walletStatus;
    let value = 0;
    const accountBalance = {
      assets: [],
      value: 0,
      account: key.account,
      apiKeyId: key.id || 'static',
    };
    if (key.account === 'static') {
      walletStatus = await this.staticCrypto.getWalletStatus(user.id);
    } else {
      const apiKey = await this.encryptor.decrypt(key.apiKey);
      const apiSecret = await this.encryptor.decrypt(key.apiSecret);
      let passphrase;
      if (key.account === 'binance') {
        walletStatus = await this.binance.getWalletStatus({ apiKey, apiSecret });
      } else if (key.account === 'kucoin') {
        passphrase = await this.encryptor.decrypt(key.passphrase);
        walletStatus = await this.kucoin.getWalletStatus({ apiKey, apiSecret, passphrase });
      } else {
        this.logger.error('Interface not recognized');
      }
      if (walletStatus) {
        await this.findMissingAssetPrice(
          market.data,
          walletStatus,
          key.account,
          {
            apiKey,
            apiSecret,
            passphrase,
          },
        );
      } else {
        this.logger.error('Could not fetch account information, desactivating apiKey');
        await key.updateApiKey('inactive');
      }
    }
    if (walletStatus.length > 0) {
      for (const crypto of walletStatus) {
        if (crypto.amount > 0) {
          value += await this.addAssetValue(market.data, crypto, accountBalance);
        }
      }
      accountBalance.value = value;
      this.logger.info('Saving wallet information in database');
      await wallet.addAccountRegistry(accountBalance);
    } else {
      this.logger.info(`No cryptos registered in ${user.username} ${key.account} account`);
    }
  }
}

module.exports = ConnectorManager;
