module.exports = function userApiKeyInstance(db, logger) {
  return {
    delete: async function registerUser(req, res) {
      const { id, apiKey } = req.params;
      const user = db.user.getUserById(id);
      await user.removeApiKey(apiKey);
      logger.info('ApiKey removed succesfully from user');
      res.status(200).json({ message: 'ApiKey removed succesfully' });
    },
  };
};
