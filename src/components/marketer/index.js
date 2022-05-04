const axios = require('axios');
const { v4: uuid } = require('uuid');
const coinMarketCap = require('./coinmarketcap');

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
    const data = await coinMarketCap.getTickerPrice();
    return { data, id: uuid() };
  }

  marketDataFormater(data) {
    this.logger.info('Formating market data');
    const result = {};
    data.forEach((coin) => {
      result[coin.symbol] = coin.price;
    });
    return result;
  }
}

module.exports = Marketer;
