module.exports = function loginController(db, logger, bcrypt, config, jwt, redis) {
  return {
    post: async function loginUser(req, res) {
      const { username, password } = req.body;
      const log = logger.child({ method: 'loginUser', user: username });
      try {
        log.info('Request to login recieved');
        const user = await db.user.getUser(username);
        if (!user) {
          logger.info('User is not registered');
          return res.status(404).json({ message: 'User does not exist' });
        }
        const passwordControl = await bcrypt.compare(password, user.getPassword());
        if (!passwordControl) {
          log.info('Invalid credentials');
          return res.status(401).json({ message: 'Invalid Credentials' });
        }
        const token = jwt.sign(
          { user_id: user.id },
          config.auth.secret,
        );
        user.token = token;
        const userJson = user.toJson();
        await redis.saveUser(userJson);
        log.info('User succesfully logged in');
        return res.status(200).json(userJson);
      } catch (err) {
        logger.info(`${username} could not log in due to ${err.message} `);
        return res.status(500).json(err.message);
      }
    },
  };
};
