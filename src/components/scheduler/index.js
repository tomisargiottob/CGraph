/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const schedule = require('node-schedule');
const config = require('config');

class Scheduler {
  constructor({
    database,
    logger,
    encryptor,
    connectorManager,
    marketer,
  }) {
    this.db = database;
    this.logger = logger.child({ module: 'Scheduler' });
    this.schedules = [];
    this.encryptor = encryptor;
    this.connectorManager = connectorManager;
    this.marketer = marketer;
  }

  async init() {
    const logger = this.logger.child({ function: 'init' });
    logger.info('Scheduling requests for all users');
    const lastMarket = await this.db.market.getLastMarket();
    if (!lastMarket) {
      logger.info('No market information found in database, fetching market data');
      await this.programMarketData();
      return;
    }
    const nextMarketTime = lastMarket.createdAt - Date.now() + Number(config.scheduler.time);
    logger.info(`Next market time ${nextMarketTime}`);
    if (nextMarketTime > 0) {
      logger.info(`Data has been fetched in the past hours, scheduling next request in ${nextMarketTime / (1000 * 60 * 60)} hours`);
      schedule.scheduleJob(
        new Date(Date.now() + Number(config.scheduler.time)),
        async () => {
          logger.info('Excecuting scheduled request to fetch market data');
          await this.programMarketData();
        },
      );
    } else {
      logger.info('24 hours have passed since the last market data register, fetching market data');
      await this.programMarketData();
    }
  }

  async programMarketData() {
    const initialTime = Date.now();
    const scheduleTime = initialTime + Number(config.scheduler.time);
    const logger = this.logger.child({ function: 'programMarketData' });

    logger.info('Fetching market data');

    const market = await this.marketer.getMarketData();
    const where = { active: true };
    const users = await this.db.user.getAllUsers({ where });

    for (const user of users) {
      await this.connectorManager.calculateUserWallet(user, market);
    }
    await this.db.market.addMarketData(market.id, market.data, initialTime);
    logger.info('Information saved, scheduling new market data fetch ');
    schedule.scheduleJob(
      scheduleTime,
      async () => {
        logger.info('Excecuting scheduled request to fetch market data');
        await this.programMarketData();
      },
    );
  }
}

module.exports = Scheduler;
