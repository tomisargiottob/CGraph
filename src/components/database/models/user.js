const logger = require('../../logger/logger');

class User {
  constructor(collection, data) {
    this.collection = collection;
    this.username = data.username;
    // eslint-disable-next-line no-underscore-dangle
    this.id = data._id;
    this.password = data.password;
    this.apiKey = data.apiKey;
    this.schedule = data.schedule;
    this.active = data.active;
  }

  getPassword() {
    return this.password;
  }

  getApiKeys() {
    const apiKeys = [];
    this.apiKey.forEach((key) => {
      apiKeys.push({
        account: key.account,
        id: key.id,
      });
    });
    return apiKeys;
  }

  async updateSchedule(schedule) {
    try {
      await this.collection.findOneAndUpdate(
        { _id: this.id },
        {
          $set:
            {
              schedule,
            },
        },
        { returnDocument: 'after' },
      );
      this.schedule = schedule;
    } catch (err) {
      logger.warn('could not update user schedule');
    }
    return this;
  }

  async addApiKeys(apiKey) {
    const apiKeys = this.apiKey;
    apiKeys.push(apiKey);
    try {
      await this.collection.findOneAndUpdate(
        { _id: this.id },
        {
          $set:
            {
              apiKey: apiKeys,
            },
        },
        { returnDocument: 'after' },
      );
      this.apiKey = apiKeys;
    } catch (err) {
      logger.warn('could not update user apiKeys');
    }
    return this;
  }

  async removeApiKey(id) {
    const $pull = {};
    $pull.apiKey = {};
    $pull.apiKey.id = id;
    try {
      await this.collection.findOneAndUpdate(
        { _id: this.id },
        {
          $pull,
        },
        { returnDocument: 'after' },
      );
      this.apiKey = this.apiKey.filter((apiKey) => id.includes(apiKey.id));
    } catch (err) {
      logger.warn('could not remove user apiKey');
    }
    return this;
  }

  toJson() {
    return {
      id: this.id,
      username: this.username,
      schedule: this.schedule,
      active: this.active,
      token: this.token,
    };
  }
}

module.exports = User;
