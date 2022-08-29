module.exports = function enableUserApiKey(db, logger, connectorManager, encryptor, errors) {
  return {
    post: async function enableApiKey(req, res) {
      const { id, apiKey } = req.params;
      const log = logger.child({ method: 'enableApiKey', userId: id, apiKey });
      try {
        const user = await db.user.getUserById(id);
        if (!user) {
          throw new errors.NotFoundError('User');
        }
        const key = await db.apiKey.getApiKey(apiKey, user.id);
        if (!key) {
          throw new errors.NotFoundError('ApiKey');
        }
        const decryptedApiKey = await encryptor.decrypt(key.apiKey);
        const decryptedApiSecret = await encryptor.decrypt(key.apiSecret);
        const decryptedPassphrase = await encryptor.decrypt(key.passphrase);
        if (key.account === 'binance' || key.account === 'kucoin') {
          const result = await connectorManager.checkApiKey(
            { apiKey: decryptedApiKey, apiSecret: decryptedApiSecret, passphrase: decryptedPassphrase, account: key.account },
          );
          if (!result.valid) {
            log.info({ user: id }, result.error);
            return res.status(400).json({ message: result.error });
          }
        } else {
          log.info({ user: id }, 'Platform not supported at the moment');
          return res.status(400).json({ message: 'Platform not supported at the moment' });
        }
        log.info({ user: id }, 'ApiKey valid, updating status in database');
        const updatedApiKey = await key.updateApiKey('active');
        log.info('ApiKey successfully enabled');
        return res.status(200).json(updatedApiKey.toJson());
      } catch (err) {
        logger.error(err.message);
        if (err instanceof errors.NotFoundError) {
          return res.status(404).json({ message: err.message });
        }
        return res.status(500).json({ message: 'Could not delete ApiKey, Internal error' });
      }
    },
  };
};
