module.exports = function loginController(db, logger, bcrypt, config, jwt, redis) {
  return {
    post: async function loginUser(req, res) {
      try {
        const { username, password } = req.body;
        const user = await db.user.getUser(username);
        if (user) {
          const passwordControl = await bcrypt.compare(password, user.getPassword());
          if (passwordControl) {
            const token = jwt.sign(
              { user_id: user.id },
              config.auth.secret,
              {
                expiresIn: '1h',
              },
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
          res.status(404).json({ message: 'User does not exist' });
        }
      } catch (err) {
        res.status(500).json({ err });
      }
    },
  };
};
