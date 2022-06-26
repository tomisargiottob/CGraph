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
      logger.info(`Se ha encontrado una consulta menor al intervalo establecido, , proxima consulta en ${nextMarketTime / (1000 * 60 * 60)} horas`);
      schedule.scheduleJob(
        nextMarketTime,
        async () => {
          logger.info('Se consulta la información del mercado');
          await this.programMarketData();
        },
      );
    } else {
      logger.info('Han pasado mas de 24 horas desde la ultima consulta, se consulta la información del mercado');
      await this.programMarketData();
    }
  }

  async programMarketData() {
    const initialTime = Date.now();
    const scheduleTime = initialTime + config.scheduler.time;
    const logger = this.logger.child({ function: 'programMarketData' });

    logger.info('Se agrega la tarea planificada de consultar la informacion');

    const market = await this.marketer.getMarketData();
    const marketId = market.id;
    const marketData = market.data;
    const where = { active: true, 'apiKey.0': { $exists: true } };
    const users = await this.db.user.getAllUsers({ where });

    users.forEach(async (user) => {
      let value = 0;
      const apiKey = await this.encryptor.decrypt(user.apiKey[0].apiKey);
      const apiSecret = await this.encryptor.decrypt(user.apiKey[0].apiSecret);

      logger.info(`Se consulta la información del usuario ${user.username}`);

      const account = await this.binance.getWalletStatus({ apiKey, apiSecret });
      const promises = [];
      const wallet = { assets: [], value: 0 };
      account.balances.forEach(async (crypto) => {
        const assets = Number(crypto.free) + Number(crypto.locked);
        if (assets > 0) {
          if (marketData[crypto.asset]) {
            const individualValue = (assets) * marketData[crypto.asset];
            wallet.assets.push({ coin: crypto.asset, value: individualValue, ammount: assets });
            value += individualValue;
          } else {
            logger.info(`missing price for ${crypto.asset}`);
            promises.push(async () => {
              try {
                marketData[crypto.asset] = await this.binance.getTickerPrice(
                  crypto.asset,
                  apiKey,
                  apiSecret,
                );
                value += (assets) * marketData[crypto.asset];
                logger.info(`Price found for ${crypto.asset}, adding to memory and user wallet`);
              } catch (err) {
                logger.warn(`Price not found for ${crypto.asset}, ${err.message}`);
              }
            });
          }
        }
      });
      await Promise.all(promises);
      wallet.value = value;
      await this.db.wallet.addUserRegister(user.id, wallet, initialTime, marketId);
    });
    await this.db.market.addMarketData(marketId, marketData, initialTime);
    schedule.scheduleJob(
      scheduleTime,
      async () => {
        logger.info('Se consulta la información del mercado');
        await this.programMarketData();
      },
    );
  }
}

module.exports = Scheduler;
