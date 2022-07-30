/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const schedule = require('node-schedule');
const config = require('config');

class Scheduler {
  constructor({
    database,
    logger,
    encryptor,
    binance,
    marketer,
  }) {
    this.db = database;
    this.logger = logger.child({ module: 'Scheduler' });
    this.schedules = [];
    this.encryptor = encryptor;
    this.binance = binance;
    this.marketer = marketer;
  }

  async init() {
    const logger = this.logger.child({ function: 'init' });
    logger.info('Scheduling requests for all users');
    const lastMarket = await this.db.market.getLastMarket();
    const nextMarketTime = lastMarket.createdAt - Date.now() + config.scheduler.time;
    if (nextMarketTime > 0) {
      logger.info(`Data has been fetched in the past hours, scheduling next request in ${nextMarketTime / (1000 * 60 * 60)} hours`);
      schedule.scheduleJob(
        new Date(Date.now() + config.scheduler.time),
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
    const scheduleTime = initialTime + config.scheduler.time;
    const logger = this.logger.child({ function: 'programMarketData' });

    logger.info('Fetching market data');

    const market = await this.marketer.getMarketData();
    const marketData = market.data;
    const marketId = market.id;
    const where = { active: true };
    const users = await this.db.user.getAllUsers({ where });

    for (const user of users) {
      let value = 0;
      const userApiKeys = await this.db.apiKey.getUserApiKeys(user.id, { status: 'active' });
      if (!userApiKeys.length) {
        logger.info(`${user.username} has no active apiKeys`);
      }
      for (const key of userApiKeys) {
        const apiKey = await this.encryptor.decrypt(key.apiKey);
        const apiSecret = await this.encryptor.decrypt(key.apiSecret);

        logger.info(`Fetching user ${user.username} wallet information`);
        const account = await this.binance.getWalletStatus({ apiKey, apiSecret });

        if (account) {
          const wallet = { assets: [], value: 0 };
          for (const crypto of account.balances) {
            const assets = Number(crypto.free) + Number(crypto.locked);
            if (assets > 0) {
              if (marketData[crypto.asset]) {
                const individualValue = (assets) * marketData[crypto.asset];
                wallet.assets.push({ coin: crypto.asset, value: individualValue, ammount: assets });
                value += individualValue;
              } else {
                logger.info(`missing price for ${crypto.asset}`);
                try {
                  marketData[crypto.asset] = await this.binance.getTickerPrice(
                    crypto.asset,
                    apiKey,
                    apiSecret,
                  );
                  value += (assets) * marketData[crypto.asset];
                  logger.info(`Price found for ${crypto.asset}, adding to memory and user wallet. Price of ${marketData[crypto.asset]}`);
                } catch (err) {
                  logger.warn(`Price not found for ${crypto.asset}, ${err.message}`);
                }
              }
            }
          }
          wallet.value = value;
          logger.info(`Saving ${user.username} wallet information in database`);
          await this.db.wallet.addUserRegister(user.id, wallet, initialTime, marketId);
        } else {
          logger.error('Could not fetch account information, desactivating apiKey');
          await key.updateApiKey('inactive');
        }
      }
    }
    await this.db.market.addMarketData(marketId, marketData, initialTime);
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
