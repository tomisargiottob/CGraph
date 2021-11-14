module.exports = function userWalletCollection(db, logger) {
  return {
    get: async function registerUser(req, res) {
      console.log('llega');
      const { username, password } = req.body;
      console.log(username, password);
      const user = db.user.getUser(username);
      console.log(user);
      res.status(200).json(user);
    },
  };
};
