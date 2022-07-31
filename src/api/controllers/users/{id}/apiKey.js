module.exports = function userApiKeyCollection(db, logger, uuid, connectorManager, encryptor) {
  const controllerLogger = logger.child({ module: 'userController' });
  return {
    get: async function getApiKeys(req, res) {
      const { id } = req.params;
      const log = controllerLogger.child({ function: 'getApiKeys', userId: id });
      try {
        const user = await db.user.getUserById(id);
        if (!user) {
          log.info('User does not exist');
          return res.status(404).json({ message: 'User does not exist' });
        }
        const apiKeys = await db.apiKey.getUserApiKeys(id);
        log.info('User fetched, sending his ApiKeys');
        const apiKeysJson = apiKeys.map((key) => key.toJson());
        return res.status(200).json({ apiKeys: apiKeysJson });
      } catch (err) {
        log.error(err.message);
        return res.status(500).json({ message: 'Could not get user apiKeys' });
      }
    },
    post: async function registerApiKey(req, res) {
      const { id } = req.params;
      const { account, apiKey, apiSecret } = req.body;
      const log = controllerLogger.child({ function: 'registerApiKey', userId: id });
      try {
        log.info('Add apiKey to user');
        const user = await db.user.getUserById(id);
        if (!user) {
          log.warn('User does not exist');
          return res.status(404).json({ message: 'User does not exist' });
        }
        log.info('Controling if apiKey is duplicated');
        const existentKeys = await db.apiKey.getUserApiKeys(user.id);
        // eslint-disable-next-line no-restricted-syntax
        for (const key of existentKeys) {
          // eslint-disable-next-line no-await-in-loop
          const oldApiKey = await encryptor.decrypt(key.apiKey);
          if (apiKey === oldApiKey) {
            log.warn('Duplicated apiKey');
            return res.status(400).json({ message: 'User has already registered this apiKey' });
          }
        }
        log.info('Checking if apiKey provided is valid');
        if (account === 'binance') {
          const result = await connectorManager.checkApiKey({ apiKey, apiSecret, account });
          if (!result.valid) {
            log.warn(result.error);
            return res.status(400).json({ message: result.error });
          }
        } else {
          log.info('Platform not supported at the moment');
          return res.status(400).json({ message: 'Platform not supported at the moment' });
        }
        log.info('ApiKey valid, encrypting data');
        const encryptedApiKey = {
          _id: uuid(),
          apiKey: await encryptor.encrypt(apiKey),
          apiSecret: await encryptor.encrypt(apiSecret),
          userId: user.id,
          account,
          status: 'active',
        };
        log.info('Saving apiKey in database');
        await db.apiKey.addUserApiKey(encryptedApiKey);
        // eslint-disable-next-line no-underscore-dangle
        const registeredApiKey = await db.apiKey.getApiKeyById(encryptedApiKey._id, user.id);
        log.info('ApiKey successfully saved');
        return res.status(200).json(registeredApiKey.toJson());
      } catch (err) {
        log.error('Could not add apiKey to user');
        return res.status(500).json(err.message);
      }
    },
  };
};
