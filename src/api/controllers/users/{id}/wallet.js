module.exports = function userWalletController(db, logger) {
  return {
    get: async function registerUser(req, res) {
      const { id } = req.params;
      const { where } = req.query;
      logger.info(`Getting wallet between dates ${where.createdAt.gt} and ${where.createdAt.lt}`);
      const wallet = await db.wallet.getUserWallet(id, where);
      res.status(200).json(wallet);
    },
  };
};
