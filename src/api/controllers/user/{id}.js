module.exports = function userIdCollection(db, logger, bcrypt) {
  return {
    get: async function registerUser(req, res) {
      const { id } = req.params;
      try {
        const user = await db.user.getUserById({ id });
        if (!user) {
          return res.status(404).json({ message: 'User does not exist' });
        }
        return res.status(200).json(user.toJson());
      } catch {
        return res.status(500).json({ message: 'Server did not respond' });
      }
    },
    patch: async function registerUser(req, res) {
      const { id } = req.params;
      let { apiKey, password, schedule } = req.body;
      try {
        const user = await db.user.getUserById({ id });
        if (!user) {
          return res.status(404).json({ message: 'User does not exist' });
        }
        if (!apiKey) {
          apiKey = user.apiKey;
        } else {
          apiKey = await bcrypt.hash(apiKey, 10);
        }
        if (!password) {
          password = user.password;
        } else {
          password = await bcrypt.hash(password, 10);
        }
        if (!schedule) {
          schedule = user.schedule;
        }
        const updatedUser = await db.user.updateUser(
          {
            id,
            apiKey,
            password,
            schedule,
          },
        );
        return res.status(200).json(updatedUser.toJson());
      } catch {
        return res.status(500).json({ message: 'Server did not respond' });
      }
    },
    delete: async function registerUser(req, res) {
      logger.info('llega');
      const { username, password } = req.body;
      logger.info(username, password);
      const user = db.user.getUser(username);
      logger.info(user);
      res.status(200).json(user);
    },
  };
};
