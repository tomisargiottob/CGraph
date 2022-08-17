/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const api = require('kucoin-node-api');

class KucoinClient {
  constructor({ logger }, config) {
    this.logger = logger.child({ module: 'kucoin' });
    this.config = {
      environment: config.environment,
    };
  }

  async testTradingPermissions(client) {
    try {
      this.logger.info('Testing trading permissions of apiKey');
      const response = await client.cancelOrder({ id: '5bd6e9286d99522a52e458de' });
      if (response.status === 403) {
        return true;
      }
      return new Error('Permissions incorrect');
    } catch (err) {
      return new Error('Permissions incorrect');
    }
  }

  async testGeneralPermissions(client) {
    try {
      this.logger.info('Testing general permissions of apiKey');
      await client.getAccounts();
    } catch (err) {
      throw new Error('Permissions incorrect');
    }
  }

  async testWithdrawlPermissions(client) {
    try {
      this.logger.info('Testing withdrawl permissions of apiKey');
      await client.applyForWithdrawal({
        currency: 'USD',
        address: '1234567',
        amount: 1,
      });
      throw new Error('Permissions incorrect');
    } catch (err) {
      if (err.response?.status === 403) {
        return true;
      }
      throw new Error('Permissions incorrect');
    }
  }

  async checkApiKey(key) {
    const logger = this.logger.child({ function: 'checkApiKey' });
    let error = '';
    try {
      api.init({
        ...this.config,
        secretKey: key.apiSecret,
        apiKey: key.apiKey,
        passphrase: key.passphrase,
      });
      await this.testTradingPermissions(api);
      await this.testGeneralPermissions(api);
      await this.testWithdrawlPermissions(api);
      await logger.info('Permissions were correct');
      return { valid: true };
    } catch (err) {
      logger.info('Invalid ApiKey', err.message);
      error = 'Invalid ApiKey, please check if the information is correct ';
    }
    return { valid: false, error };
  }

  async getWalletStatus(key) {
    try {
      api.init({
        ...this.config,
        secretKey: key.apiSecret,
        apiKey: key.apiKey,
        passphrase: key.passphrase,
      });
      const cryptos = await api.getAccounts();
      let procesedWallet;
      const finalWallet = [];
      this.logger.info({ function: 'getWalletStatus' }, 'Kucoin accounts succesfully fetched');
      if (cryptos && cryptos.data) {
        this.logger.debug({ function: 'getWalletStatus' }, 'Calculating amount of each asset');
        procesedWallet = cryptos.data.reduce((accWallet, asset) => {
          if (accWallet[asset.currency]) {
            accWallet[asset.currency] += +asset.balance;
          } else {
            accWallet[asset.currency] = +asset.balance;
          }
          return accWallet;
        }, {});
        for (const [asset, amount] of Object.entries(procesedWallet)) {
          finalWallet.push({ asset, amount });
        }
      }
      return finalWallet;
    } catch (err) {
      this.logger.error({ function: 'getWalletStatus' }, err.message);
      return false;
    }
  }

  async getTickerPrice(ticker) {
    const logger = this.logger.child({ function: 'getTickerPrice', ticker });
    logger.info('Searching ticker price');
    api.init({ ...this.config });
    const response = await api.getTicker(`${ticker}-USDT`);
    logger.info(`Ticker Information of ${ticker} succesfully fetched`);
    return response.data.price;
  }
}

module.exports = KucoinClient;
