const axios = require('axios');

class Marketer {
  constructor(logger, database) {
    this.logger = logger.child({ module: 'Marketer' });
    this.db = database;
    this.client = axios.create({
      baseURL: 'https://data.messari.io/',
      timeout: 3000,
    });
  }

  async getMarketData() {
    const log = this.logger.child({ function: 'getMarketData' });
    log.info('Recopilando información del mercado');
    const market = await this.client.get('api/v1/assets?fields=id,slug,symbol,metrics/market_data/price_usd&limit=500');
    // console.log(market);
    market.data.data.some((asset) => {
      if (asset.symbol === 'BTC') {
        console.log(new Date(), asset.metrics.market_data.price_usd);
        return true;
      }
      return false;
    });
  }
}

module.exports = Marketer;
