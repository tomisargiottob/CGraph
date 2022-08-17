module.exports = function userApiKeyInstance(db, logger, errors) {
  return {
    delete: async function removeApiKey(req, res) {
      const { id, apiKey } = req.params;
      try {
        const user = await db.user.getUserById(id);
        if (!user) {
          throw new errors.NotFoundError('User');
        }
        const userApiKey = await db.apiKey.getApiKey(apiKey, user.id);
        if (!userApiKey) {
          throw new errors.NotFoundError('userApiKey');
        }
        await userApiKey.removeApiKey();
        logger.info('ApiKey removed succesfully from user');
        return res.status(200).json({ message: 'ApiKey removed succesfully' });
      } catch (err) {
        logger.error(err.message);
        if (err instanceof errors.NotFoundError) {
          return res.status(404).json({ message: 'User not found' });
        }
        return res.status(500).json({ message: 'Could not delete ApiKey, Internal error' });
      }
    },
  };
};
