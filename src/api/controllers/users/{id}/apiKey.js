module.exports = function userApiKeyCollection(db, logger, uuid, binance, encryptor) {
  const controllerLogger = logger.child({ module: 'userController' });
  return {
    get: async function getApiKeys(req, res) {
      const getLogger = controllerLogger.child({ function: 'getApiKeys' });
      const { id } = req.params;
      const user = await db.user.getUserById(id);
      if (!user) {
        getLogger.info({ user: id }, 'User does not exist');
        return res.status(404).json({ message: 'User does not exist' });
      }
      const apiKeys = user.getApiKeys();
      getLogger.info({ user: id }, 'User fetched, sending his ApiKeys');
      return res.status(200).json(apiKeys);
    },
    post: async function registerApiKey(req, res) {
      const postLogger = controllerLogger.child({ function: 'registerApiKey' });
      const { id } = req.params;
      const { account, apiKey, apiSecret } = req.body;
      postLogger.info({ user: id }, 'Add apiKey to user');
      let user = await db.user.getUserById(id);
      if (!user) {
        postLogger.info({ user: id }, 'User does not exist');
        return res.status(404).json({ message: 'User does not exist' });
      }
      postLogger.info({ user: id }, 'Checking if apiKey provided is valid');
      if (account === 'binance') {
        const result = await binance.checkApiKey({ apiKey, apiSecret });
        if (!result.valid) {
          postLogger.info({ user: id }, result.error);
          return res.status(400).json({ message: result.error });
        }
      } else {
        postLogger.info({ user: id }, 'Platform not supported at the moment');
        return res.status(400).json({ message: 'Platform not supported at the moment' });
      }
      const encryptedApiKey = {
        id: uuid(),
        apiKey: await encryptor.encrypt(apiKey),
        apiSecret: await encryptor.encrypt(apiSecret),
        account,
      };
      postLogger.info({ user: id }, 'ApiKey valid, saving it in database');
      user = await user.addApiKeys(encryptedApiKey);
      return res.status(200).json(user.toJson());
    },
  };
};
