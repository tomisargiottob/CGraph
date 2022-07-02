module.exports = function loginController(db, logger, bcrypt, config, jwt, redis) {
  return {
    post: async function logoutUser(req, res) {
      try {
        await redis.removeUser(req.user.token);
        logger.info(`request to logout from ${req.user && req.user.username} succesfully processed`);
        res.status(204).json();
      } catch (err) {
        logger.info(`${req.user && req.user.username} could not log out due to ${err.message} `);
        res.status(500).json(err.message);
      }
    },
  };
};
