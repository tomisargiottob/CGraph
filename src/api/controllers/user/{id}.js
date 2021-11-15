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
      const { apiKey, password, schedule } = req.body;
      let encryptedApiKey;
      let encryptedPassword;
      try {
        if (apiKey) {
          encryptedApiKey = await bcrypt.hash(apiKey, 10);
        }
        if (password) {
          encryptedPassword = await bcrypt.hash(password, 10);
        }
        await db.user.updateUser(id,
          {
            apiKey: encryptedApiKey,
            password: encryptedPassword,
            schedule,
          });
        return res.status(200).json({ message: 'User information updated succesfully' });
      } catch {
        return res.status(500).json({ message: 'Server did not respond' });
      }
    },
    delete: async function registerUser(req, res) {
      const { id } = req.params;
      const { active } = req.body;
      try {
        const user = await db.user.getUserById({ id });
        if (!user) {
          return res.status(404).json({ message: 'User does not exist' });
        }
        await db.user.updateUser(
          id,
          {
            active,
          },
        );
        return res.status(200).json({ message: 'User information updated succesfully' });
      } catch {
        return res.status(500).json({ message: 'Server did not respond' });
      }
    },
  };
};
