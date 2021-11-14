class User {
  constructor(data) {
    this.username = data.username;
    // eslint-disable-next-line no-underscore-dangle
    this.id = data._id;
    this.password = data.password;
    this.apiKey = data.apiKey;
    this.schedule = data.schedule;
  }

  getPassword() {
    return this.password;
  }

  getWallet() {
    return this.wallet;
  }

  getApiKey() {
    return this.apiKey;
  }

  toJson() {
    return {
      id: this.id,
      username: this.username,
      token: this.token,
    };
  }
}

module.exports = User;
