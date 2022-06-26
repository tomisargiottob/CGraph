class Market {
  constructor(collection, data) {
    this.collection = collection;
    this.createdAt = data.createdAt;
    // eslint-disable-next-line no-underscore-dangle
    this.id = data._id;
    this.prices = data.prices;
  }

  toJson() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      prices: this.prices,
    };
  }
}

module.exports = Market;
