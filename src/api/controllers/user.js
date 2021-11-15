module.exports = function userCollection(db, logger, config, jwt, bcrypt, uuid, scheduler) {
  return {
    post: async function registerUser(req, res) {
      const { username, password } = req.body;
      try {
        const oldUser = await db.user.getUser({ username });
        if (oldUser) {
          return res.status(409).send('Username already registered, please logIn or try an otherone');
        }
        const encryptedPassword = await bcrypt.hash(password, 10);
        const user = await db.user.createUser({
          _id: uuid(),
          username,
          password: encryptedPassword,
        });
        scheduler.program(user);
        const token = jwt.sign(
          // eslint-disable-next-line no-underscore-dangle
          { user_id: user.id },
          config.auth.secret,
          {
            expiresIn: '1h',
          },
        );
        user.token = token;
        return res.status(201).json(user.toJson());
      } catch (err) {
        logger.error(err);
        return res.status(500).json({ message: 'User could not be registered' });
      }
    },
  };
};
