module.exports = function disableUserApiKey(db, logger, errors) {
  return {
    post: async function disableApiKey(req, res) {
      const { id, apiKey } = req.params;
      const log = logger.child({ method: 'disableApiKey', userId: id, apiKey });
      try {
        log.info('Searching for user information');
        const user = await db.user.getUserById(id);
        if (!user) {
          throw new errors.NotFoundError('User');
        }
        log.info('Searching for user apiKey');
        const key = await db.apiKey.getApiKey(apiKey, user.id);
        if (!key) {
          throw new errors.NotFoundError('ApiKey');
        }
        const updatedApiKey = await key.updateApiKey('inactive');
        log.info('ApiKey successfully disabled');
        return res.status(200).json(updatedApiKey.toJson());
      } catch (err) {
        logger.error(err.message);
        if (err instanceof errors.NotFoundError) {
          return res.status(404).json({ message: err.message });
        }
        return res.status(500).json({ message: 'Could not disable ApiKey, Internal error' });
      }
    },
  };
};
