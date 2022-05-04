const { createClient } = require('redis');
const config = require('config');
const logger = require('../logger/logger');

class RedisConnector {
  constructor() {
    this.logger = logger.child({ module: 'RedisConnector' });
    this.client = createClient({
      url: 'redis://localhost:6379',
    });
    this.client.on('error', (err) => this.logger.info(`Redis Client Error, ${err}`));
  }

  async connect() {
    await this.client.connect();
  }

  async saveUser(user) {
    await this.client.setEx(user.token, config.auth.duration, JSON.stringify(user));
  }

  async getUser(token) {
    const user = await this.client.getEx(token, { EX: config.auth.duration });
    return user;
  }

  async removeUser(token) {
    await this.client.del(token);
  }
}

module.exports = RedisConnector;
