module.exports = function userWalletController(db, logger) {
  return {
    get: async function registerUser(req, res) {
      const { id } = req.params;
      const { where } = req.query;
      const filter = {};
      if (where) {
        filter.where = where;
      } else {
        const today = new Date();
        const pastDate = today.setMonth(today.getMonth() - 3);
        filter.where = {
          gt: pastDate.getTime(),
          lt: today.getTime(),
        };
      }
      logger.info(`Getting wallet between dates ${filter.where.gt} and ${filter.where.lt}`);
      const wallet = await db.wallet.getUserWallet(id, filter);
      res.status(200).json(wallet);
    },
  };
};
