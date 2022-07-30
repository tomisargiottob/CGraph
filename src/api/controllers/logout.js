module.exports = function loginController(logger, redis) {
  return {
    post: async function logoutUser(req, res) {
      const log = logger.child({ method: 'logoutUser', user: req.user && req.user.username });
      try {
        await redis.removeUser(req.user.token);
        log.info('request to logout succesfully processed');
        res.status(204).json();
      } catch (err) {
        log.info(`Could not log out due to ${err.message} `);
        res.status(500).json(err.message);
      }
    },
  };
};
