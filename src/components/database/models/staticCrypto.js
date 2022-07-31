class StaticCrypto {
  constructor(collection, data) {
    this.collection = collection;
    this.createdAt = data.createdAt;
    // eslint-disable-next-line no-underscore-dangle
    this.id = data._id;
    this.amount = data.amount;
    this.asset = data.asset;
    this.averagePrice = data.averagePrice;
    this.userId = data.userId;
  }

  async update(updateData) {
    const {
      amount,
      averagePrice,
    } = updateData;
    const staticCrypto = await this.collection.findOneAndUpdate(
      { _id: this.id },
      {
        $set:
          {
            amount: amount || this.amount,
            averagePrice: averagePrice || this.averagePrice,
          },
      },
      { returnDocument: 'after' },
    );
    this.amount = staticCrypto.value.amount;
    this.averagePrice = staticCrypto.value.averagePrice;
    return this;
  }

  async delete() {
    await this.collection.deleteOne({ _id: this.id });
  }

  toJson() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      amount: this.amount,
      asset: this.asset,
      averagePrice: this.averagePrice,
    };
  }
}

module.exports = StaticCrypto;
