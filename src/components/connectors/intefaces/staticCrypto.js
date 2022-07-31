class StaticCryptoInterface {
  constructor(logger, db) {
    this.logger = logger.child({ module: 'StaticCryptoInterface' });
    this.db = db;
  }

  async getWalletStatus(userId) {
    try {
      const balance = await this.db.staticCrypto.findUserStaticCryptos(userId);
      this.logger.info({ function: 'getWalletStatus' }, 'Information succesfully fetched');
      const procesedWallet = balance.map((crypto) => (
        { amount: crypto.amount, asset: crypto.asset }
      ));
      return procesedWallet;
    } catch (err) {
      this.logger.error({ function: 'getWalletStatus' }, err.message);
      return false;
    }
  }
}

module.exports = StaticCryptoInterface;
