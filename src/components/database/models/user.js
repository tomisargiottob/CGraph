class User {
  constructor(collection, data) {
    this.collection = collection;
    this.username = data.username;
    // eslint-disable-next-line no-underscore-dangle
    this.id = data._id;
    this.password = data.password;
    this.schedule = data.schedule;
    this.active = data.active;
    this.firstName = data.firstName;
    this.surname = data.surname;
    this.birthDate = data.birthDate;
    this.createdAt = data.createdAt;
  }

  getPassword() {
    return this.password;
  }

  async updateSchedule(schedule) {
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
    return this;
  }

  toJson() {
    return {
      id: this.id,
      username: this.username,
      schedule: this.schedule,
      active: this.active,
      firstName: this.firstName,
      surname: this.surname,
      createdAt: this.createdAt,
      birthDate: this.birthDate,
      token: this.token,
    };
  }
}

module.exports = User;
