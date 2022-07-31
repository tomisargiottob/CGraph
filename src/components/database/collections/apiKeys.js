const ApiKeyModel = require('../models/apiKey');

class ApiKey {
  constructor(db) {
    this.db = db;
    this.collection = this.db.collection('apiKeys');
  }

  async getUserApiKeys(userId, where) {
    const apiKeys = await this.collection.find({ userId, ...where }).toArray();
    const userApiKeys = apiKeys.map((key) => new ApiKeyModel(this.collection, key));
    return userApiKeys || [];
  }

  async addUserApiKey(apiKey) {
    // eslint-disable-next-line no-param-reassign
    apiKey.createdAt = Date.now();
    await this.collection.insertOne(apiKey);
  }

  async getApiKey(apiKeyId, userId) {
    const apiKey = await this.collection.findOne({ _id: apiKeyId, userId });
    return new ApiKeyModel(this.collection, apiKey);
  }
}

module.exports = ApiKey;
