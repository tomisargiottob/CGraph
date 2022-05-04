module.exports = function userController(db, logger, config, jwt, bcrypt, uuid) {
  const controllerLogger = logger.child({ module: 'userController' });
  return {
    post: async function registerUser(req, res) {
      const postLogger = controllerLogger.child({ function: 'registerUser' });
      const { username, password } = req.body;
      if (!username || !password) {
        postLogger.error('Missing information to create user');
        return res.status(400).json({ message: 'Missing required information' });
      }
      postLogger.info('Create user request recieved');
      try {
        const oldUser = await db.user.getUser(username);
        if (oldUser) {
          postLogger.info('User already existed');
          return res.status(409).send('Username already registered, please logIn or try an otherone');
        }
        const encryptedPassword = await bcrypt.hash(password, 10);
        const user = await db.user.createUser({
          _id: uuid(),
          username,
          password: encryptedPassword,
        });
        postLogger.info({ user: user.id }, 'User succesfully created');
        const token = jwt.sign(
          // eslint-disable-next-line no-underscore-dangle
          { user_id: user.id },
          config.auth.secret,
        );
        user.token = token;
        return res.status(201).json(user.toJson());
      } catch (err) {
        postLogger.error(err);
        return res.status(500).json({ message: 'User could not be registered' });
      }
    },
  };
};
