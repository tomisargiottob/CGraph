class ApiKey {
  constructor(collection, data) {
    this.collection = collection;
    // eslint-disable-next-line no-underscore-dangle
    this.id = data._id;
    this.status = data.status;
    this.apiKey = data.apiKey;
    this.apiSecret = data.apiSecret;
    this.account = data.account;
    this.createdAt = data.createdAt;
  }

  async removeApiKey() {
    await this.collection.deleteOne({ _id: this.id });
  }

  async updateApiKey(status) {
    const updatedApiKey = await this.collection.findOneAndUpdate({ _id: this.id },
      {
        $set:
          {
            status,
          },
      },
      { returnDocument: 'after' });
    this.status = updatedApiKey.value?.status;
    return this;
  }

  toJson() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      account: this.account,
      status: this.status,
    };
  }
}

module.exports = ApiKey;
