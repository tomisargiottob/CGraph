module.exports = function userIdController(db, logger, bcrypt) {
  return {
    get: async function getUserProfile(req, res) {
      const log = logger.child({ method: 'getUserProfile' });
      const { id } = req.params;
      try {
        log.info({ id }, 'Searching user Information');
        const user = await db.user.getUserById(id);
        if (!user) {
          log.warn({ id }, 'User is not registered');
          return res.status(404).json({ message: 'User does not exist' });
        }
        log.info({ id }, 'User found, sending information');
        return res.status(200).json(user.toJson());
      } catch (err) {
        log.error({ id }, err.message);
        return res.status(500).json({ message: 'Server did not respond' });
      }
    },
    patch: async function updateUserData(req, res) {
      const { id } = req.params;
      const { password } = req.body;
      const log = logger.child({ method: 'updateUserData', id });
      let encryptedPassword;
      try {
        const user = await db.user.getUserById(id);
        if (!user) {
          log.warn({ id }, 'User is not registered');
          return res.status(404).json({ message: 'User does not exist' });
        }
        if (password) {
          log.info('Encrypting user password');
          encryptedPassword = await bcrypt.hash(password, 10);
        }
        log.info('Updating user information');
        await user.updateUser(
          {
            password: encryptedPassword,
          },
        );
        log.info('User information successfully updated');
        return res.status(200).json({ message: 'User information updated succesfully' });
      } catch (err) {
        log.error('Could not update user', err.message);
        return res.status(500).json({ message: `Server did not respond, ${err.message}` });
      }
    },
    delete: async function desactivateUser(req, res) {
      const { id } = req.params;
      const { active } = req.body;
      const log = logger.child({ method: 'desactivateUser', id });
      try {
        log.info('Searching for user to delete');
        const user = await db.user.getUserById(id);
        if (!user) {
          log.warn('User does not exist');
          return res.status(404).json({ message: 'User does not exist' });
        }
        log.info('Desactivating user');
        await db.user.updateUser(
          id,
          {
            active,
          },
        );
        log.info('User succesfully desactivated');
        return res.status(200).json({ message: 'User information updated succesfully' });
      } catch (err) {
        log.error('Could not desactivate user', err.message);
        return res.status(500).json({ message: 'Server did not respond' });
      }
    },
  };
};
