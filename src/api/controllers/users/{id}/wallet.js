module.exports = function userWalletController(db, logger) {
  return {
    get: async function getWallet(req, res) {
      const { id } = req.params;
      const { where } = req.query;
      const log = logger.child({ module: 'controller', method: 'getWallet', id });
      try {
        log.info('Searching for user information');
        const user = await db.user.getUserById(id);
        if (!user) {
          log.warn('User does not exist');
          return res.status(404).json('User does not exist');
        }
        log.info(`Getting wallet between dates ${where.createdAt.gt} and ${where.createdAt.lt}`);
        const wallet = await db.wallet.getUserWallet(id, where);
        return res.status(200).json(wallet);
      } catch (err) {
        log.error('Could not fetch user wallets');
        return res.status(500).json(err.message);
      }
    },
  };
};
