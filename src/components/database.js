const { MongoClient } = require('mongodb');
const config = require('config');


class Database{
	constructor() {
		this.client = new MongoClient(config.mongodb.uri);
	}

	async connect() {
		await this.client.connect();
		console.log('Connected successfully to server');
	}
}

module.exports = new Database();