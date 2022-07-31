module.exports = function staticCryptoInstanceController(logger, db) {
  const log = logger.child({ module: 'staticCryptoInstanceController' });
  return {
    patch: async function updateStaticCrypto(req, res) {
      const { id, crypto } = req.params;
      const { amount, averagePrice } = req.body;
      log.info('Update static crypto request recieved');
      try {
        const user = await db.user.getUserById(id);
        if (!user) {
          log.warn('User does not exist');
          return res.status(404).json({ message: 'User does not exist' });
        }
        const staticCrypto = await db.staticCrypto.findStaticCryptoById(crypto, user.id);
        if (!staticCrypto) {
          log.warn('Static crypto does not exist');
          return res.status(404).json({ message: 'Static crypto does not exist' });
        }
        log.info('Updating static crypto data');
        const updatedStaticCrypto = await staticCrypto.update(
          { amount, averagePrice },
        );
        return res.status(200).json(updatedStaticCrypto.toJson());
      } catch (err) {
        log.error(err.message);
        return res.status(500).json({ message: err.message });
      }
    },

    delete: async function removeStaticCrypto(req, res) {
      const { id, crypto } = req.params;
      log.info('remove static crypto request recieved');
      try {
        const user = await db.user.getUserById(id);
        if (!user) {
          log.warn('User does not exist');
          return res.status(404).json({ message: 'User does not exist' });
        }
        const staticCrypto = await db.staticCrypto.findStaticCryptoById(crypto, user.id);
        if (!staticCrypto) {
          log.warn('Static crypto does not exist');
          return res.status(404).json({ message: 'Static crypto does not exist' });
        }
        await staticCrypto.delete();
        return res.status(204).json();
      } catch (err) {
        log.error(err.message);
        return res.status(500).json({ message: err.message });
      }
    },
  };
};
