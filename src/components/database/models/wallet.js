class Wallet {
  constructor(collection, data) {
    this.collection = collection;
    this.createdAt = data.createdAt;
    // eslint-disable-next-line no-underscore-dangle
    this.id = data._id;
    this.accounts = data.accounts;
    this.marketId = data.marketId;
    this.totalValue = data.totalValue;
  }

  async addAccountRegistry(account) {
    this.totalValue += account.value;
    this.accounts.push = account;
    await this.collection.updateOne({
      _id: this.id,
    }, {
      $set: {
        totalValue: this.totalValue,
      },
      $push: {
        accounts: account,
      },
    });
  }

  toJson() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      prices: this.prices,
    };
  }
}

module.exports = Wallet;
