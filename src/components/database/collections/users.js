const UserModel = require('../models/user');

class Users {
  constructor(db, logger) {
    this.db = db;
    this.collection = this.db.collection('user');
    this.logger = logger;
  }

  async getAllUsers() {
    try {
      const usersFetched = await this.collection.find();
      const users = usersFetched.map((user) => new UserModel(user));
      return users;
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }

  async getUser({ username }) {
    try {
      const user = await this.collection.findOne({ username });
      if (user) {
        return new UserModel(user);
      }
      return user;
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }

  async getUserById({ id }) {
    try {
      const user = await this.collection.findOne({ _id: id });
      if (user) {
        return new UserModel(user);
      }
      return user;
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }

  async createUser(data) {
    try {
      const user = data;
      await this.collection.insertOne(data);
      return new UserModel(user);
    } catch (err) {
      this.logger.error(err);
      return err;
    }
  }

  async updateUser(
    {
      id,
      password,
      apiKey,
      schedule,
    },
  ) {
    try {
      const user = await this.collection.findOneAndUpdate(
        { _id: id },
        { $set: { apiKey, password, schedule } },
        { returnNewDocument: true },
      );
      return new UserModel(user.value);
    } catch (err) {
      this.logger.error(err);
      return '';
    }
  }
}

module.exports = Users;
