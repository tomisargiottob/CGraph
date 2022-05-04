const config = require('config');
const CoinMarketCap = require('coinmarketcap-api');
const logger = require('../logger/logger');

class CMCMarketer {
  constructor() {
    this.client = new CoinMarketCap(config.coinmarketcap.apiKey);
  }

  async getTickerPrice() {
    try {
      const response = await this.client.getTickers({ limit: config.coinmarketcap.limit });
      const data = {};
      response.data.forEach((coin) => {
        data[coin.symbol] = coin.quote.USD.price;
      });
      return data;
    } catch (err) {
      logger.error(`Error fetching market data ${err.message}`);
      throw err;
    }
  }
}

module.exports = new CMCMarketer();
