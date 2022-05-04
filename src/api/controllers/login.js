module.exports = function loginController(db, logger, bcrypt, config, jwt, redis) {
  return {
    post: async function loginUser(req, res) {
      const { username, password } = req.body;
      try {
        logger.info(`request to login from ${username} recieved`);
        const user = await db.user.getUser(username);
        if (user) {
          const passwordControl = await bcrypt.compare(password, user.getPassword());
          if (passwordControl) {
            const token = jwt.sign(
              { user_id: user.id },
              config.auth.secret,
            );
            user.token = token;
            const userJson = user.toJson();
            await redis.saveUser(userJson);
            logger.info(`${username} succesfully logged in`);
            res.status(200).json(userJson);
          } else {
            logger.info(`Invalid credentials for ${username} `);
            res.status(401).json({ message: 'Invalid Credentials' });
          }
        } else {
          logger.info(`${username} is not registered `);
          res.status(404).json({ message: 'User does not exist' });
        }
      } catch (err) {
        logger.info(`${username} could not log in due to ${err.message} `);
        res.status(500).json(err.message);
      }
    },
    delete: async function logoutUser(req, res) {
      logger.info(`request to logout from ${req.user && req.user.username} recieved`);
      try {
        await redis.removeUser(req.user.token);
        res.status(204).json();
      } catch (err) {
        logger.info(`${req.user.username} could not log out due to ${err.message} `);
        res.status(500).json(err.message);
      }
    },
  };
};
