const axios = require('axios');
const config = require('config');
const CoinMarketCap = require('coinmarketcap-api');

class CMCMarketer {
  constructor() {
    this.client = new CoinMarketCap(config.coinmarketcap.apiKey);
  }

  async getTickerPrice() {
    try {
      const response = await this.client.getTickers({ limit: 3000 });
      const data = {};
      response.data.forEach((coin) => {
        data[coin.symbol] = coin.quote.USD.price;
      });
      return data;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}

module.exports = new CMCMarketer();