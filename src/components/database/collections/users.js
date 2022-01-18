const UserModel = require('../models/user');

class Users {
  constructor(db, logger) {
    this.db = db;
    this.collection = this.db.collection('user');
    this.logger = logger;
  }

  async getAllUsers({ where }) {
    try {
      const usersFetched = await this.collection.find(where).toArray();
      const users = [];
      usersFetched.forEach((user) => users.push(new UserModel(this.collection, user)));
      return users;
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }

  async getUser(username) {
    try {
      const user = await this.collection.findOne({ username });
      if (user) {
        return new UserModel(this.collection, user);
      }
      return user;
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }

  async getUserById(id) {
    try {
      const user = await this.collection.findOne({ _id: id });
      if (user) {
        return new UserModel(this.collection, user);
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
      user.active = true;
      user.apiKey = [];
      user.createdAt = Date.now();
      await this.collection.insertOne(user);
      return new UserModel(this.collection, user);
    } catch (err) {
      this.logger.error(err);
      return err;
    }
  }

  async updateUser(id, updateData) {
    let {
      password,
    } = updateData;
    let user;
    try {
      if (!password) {
        password = this.password;
      }
      user = await this.collection.findOneAndUpdate(
        { _id: id },
        {
          $set:
            {
              password,
            },
        },
        { returnDocument: 'after' },
      );
      this.password = password;
    } catch (err) {
      this.logger.error(err);
    }
    return user;
  }
}

module.exports = Users;
