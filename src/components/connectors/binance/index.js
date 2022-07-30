const { Spot } = require('@binance/connector');

class BinanceClient {
  constructor(logger) {
    this.logger = logger.child({ module: 'binance' });
  }

  async checkApiKey({ apiKey, apiSecret }) {
    const logger = this.logger.child({ function: 'checkApiKey' });
    const client = new Spot(apiKey, apiSecret);
    let error = '';
    let invalid = true;
    try {
      const resultado = await client.apiPermissions({ recvWindow: 5000 });
      if (resultado?.data) {
        logger.info('Valid ApiKey, checking permissions');
        invalid = Object.keys(resultado.data).some((permission) => {
          if (['enableReading', 'createTime'].includes(permission)) {
            if (resultado.data[permission]) {
              return false;
            }
            logger.info(`ApiKey had ${permission} disabled`);
            error = `ApiKey must have ${permission} permission enabled to get the wallet information`;
            return true;
          }
          if (!resultado.data[permission]) {
            return false;
          }
          logger.info(`ApiKey had ${permission} enabled`);
          error = `For security reasons, ApiKey should not have ${permission} permission enabled`;
          return true;
        });
      }
      logger.info('Permissions were correct');
    } catch (err) {
      logger.info('Invalid ApiKey');
      invalid = true;
      error = 'Invalid ApiKey, please check if the information is correct ';
    }
    return { valid: !invalid, error };
  }

  async getWalletStatus({ apiKey, apiSecret }) {
    try {
      const client = new Spot(apiKey, apiSecret);
      const response = await client.account();
      this.logger.info({ function: 'getWalletStatus' }, 'Information succesfully fetched');
      return response.data;
    } catch (err) {
      this.logger.error({ function: 'getWalletStatus' }, err.message);
      return false;
    }
  }

  async getTickerPrice(ticker, apiKey, apiSecret) {
    const logger = this.logger.child({ function: 'getWalletStatus' });
    const client = new Spot(apiKey, apiSecret);
    const response = await client.tickerPrice(`${ticker}USDT`);
    logger.info(`Ticker Information of ${ticker} succesfully fetched`);
    return response.data.price;
  }
}

module.exports = BinanceClient;
