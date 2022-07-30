const UserModel = require('../models/user');

class Users {
  constructor(db) {
    this.db = db;
    this.collection = this.db.collection('user');
  }

  async getAllUsers({ where }) {
    const usersFetched = await this.collection.find(where).toArray();
    const users = [];
    usersFetched.forEach((user) => users.push(new UserModel(this.collection, user)));
    return users;
  }

  async getUser(username) {
    const user = await this.collection.findOne({ username });
    if (user) {
      return new UserModel(this.collection, user);
    }
    return user;
  }

  async getUserById(id) {
    const user = await this.collection.findOne({ _id: id });
    if (user) {
      return new UserModel(this.collection, user);
    }
    return user;
  }

  async createUser(data) {
    const user = data;
    user.active = true;
    user.createdAt = Date.now();
    await this.collection.insertOne(user);
    return new UserModel(this.collection, user);
  }

  async updateUser(id, updateData) {
    let {
      password,
    } = updateData;
    if (!password) {
      password = this.password;
    }
    const user = await this.collection.findOneAndUpdate(
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
    return user;
  }
}

module.exports = Users;
