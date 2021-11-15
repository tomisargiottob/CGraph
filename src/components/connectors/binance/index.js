const { Spot } = require('@binance/connector');

class BinanceClient {
  constructor(logger) {
    this.logger = logger;
  }

  // eslint-disable-next-line class-methods-use-this
  async checkApiKey() {
    const apiKey = 'vGjJQUk9YWqwARaiAOKZfQLMReoXc60fcPtn4TXhyYLWrGYz4LSxxHN6gjRozzLk';
    const apiSecret = 'nvplYjpAgAXBHlOATPbP6z7ND4wUeVUk40QK9elfVIEQoQQaGg3lfV1XHpMrjTHE';
    const client = new Spot(apiKey, apiSecret);
    // const resultado = await this.client.get
    // (`/sapi/v1/account/apiRestrictions?timestamp=${Date.now()}&signature=${signature}`);
    try {
      const resultado = await client.apiPermissions({ recvWindow: 5000 });
      this.logger.info(resultado.data);
    } catch (err) {
      this.logger.error(err);
    }
  }
}

// const cliente = new BinanceClient();
// cliente.checkApiKey();

module.exports = BinanceClient;
