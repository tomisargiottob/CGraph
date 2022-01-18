const schedule = require('node-schedule');

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
    this.programMarketData();
    // const marketData = await this.db.market.getLastMarket();
    // users.forEach((user) => {
    //   this.program(user);
    // });
  }

  // program(user) {
  //   user.apiKey.forEach(async (key) => {
  //     const apiKey = await this.encryptor.decrypt(key.apiKey);
  //     const apiSecret = await this.encryptor.decrypt(key.apiSecret);
  //     this.binance.getWalletStatus(apiKey, apiSecret);
  //     const today = new Date();
  //     const logger = this.logger.child({ function: 'program' });
      // if (user.schedule && user.schedule.time && user.schedule.frecuency) {
      //   const parsedTime = user.schedule.time.split(':');
      //   const time = {
      //     hours: parsedTime[0],
      //     minutes: parsedTime[1],
      //   };
      //   const planned = new Date().setHours(time.hours, time.minutes);
      //   if (user.schedule.last) {
      //     if (user.schedule.last > (Date.now() - user.schedule.frecuency * 60 * 1000)) {
      //       const scheduleTime = user.schedule.last + user.schedule.frecuency * 60 * 1000;
      //       const job = schedule.scheduleJob(
      //         scheduleTime,
      //         async () => {
      //           logger.warn('Ejecutar la consulta a binance segun esquema de usuario');
      //           if (user.wallet) {
      //             // user.wallet.push(scheduleTime);
      //             console.log('agrego registro a la wallet');
      //           } else {
      //             // eslint-disable-next-line no-param-reassign
      //             console.log('creo el primer registro de la wallet');
      //           }
      //           const updatedUser = await user.updateSchedule(
      //             {
      //               time: user.schedule.time,
      //               frecuency: user.schedule.frecuency,
      //               last: scheduleTime,
      //             },
      //           );
      //           this.program(updatedUser);
      //         },
      //       );
      //       this.schedules.push(job);
      //     } else {
      //       const defaultTime = Date.now() + 20000;
      //       const job = schedule.scheduleJob(defaultTime, async () => {
      //         logger.warn('Ejecutar la consulta a binance en tiempo por defecto por que se paso su tiempo');
      //         if (user.wallet) {
      //           console.log('agrego registro a la wallet');
      //         } else {
      //           // eslint-disable-next-line no-param-reassign
      //           // user.wallet = [];
      //           console.log('creo el primer registro de la wallet');
      //         }
      //         const updatedUser = await user.updateSchedule({
      //           time: user.schedule.time,
      //           frecuency: user.schedule.frecuency,
      //           last: defaultTime,
      //         });
      //         this.program(updatedUser);
      //       });
      //       this.schedules.push(job);
      //     }
      //   } else if (planned > today) {
      //     const job = schedule.scheduleJob(planned, async () => {
      //       logger.warn('Ejecutar la consulta a binance en tiempo planeado');
      //       if (user.wallet) {
      //         console.log('agrego registro a la wallet');
      //       } else {
      //         // eslint-disable-next-line no-param-reassign
      //         // user.wallet = [];
      //         console.log('creo el primer registro de la wallet');
      //       }
      //       const updatedUser = await user.updateSchedule({
      //         time: user.schedule.time,
      //         frecuency: user.schedule.frecuency,
      //         last: planned.getTime(),
      //       });
      //       this.program(updatedUser);
      //     });
      //     this.schedules.push(job);
      //   } else {
      // const defaultTime = Date.now() + 20000;
      // const job = schedule.scheduleJob(new Date(defaultTime), async () => {
      //   logger.warn('Ejecutar la consulta a binance en tiempo por defecto');
      //   if (user.wallet) {
      //     console.log('agrego registro a la wallet');
      //   } else {
      //     // eslint-disable-next-line no-param-reassign
      //     // user.wallet = [];
      //     console.log('creo el primer registro de la wallet');
      //   }
      //   const updatedUser = await user.updateSchedule({
      //     time: user.schedule.time,
      //     frecuency: user.schedule.frecuency,
      //     last: defaultTime,
      //   });
      //   this.program(updatedUser);
      // });
      // this.schedules.push(job);
      // }
      // } else {
  //     const instantDate = Date.now() + 10000;
  //     const job = schedule.scheduleJob(instantDate, async () => {
  //       logger.warn(`El usuario ${user.username} no tiene registrado schedule se ha ejecutado en tiempo por defecto`);
  //       if (user.wallet) {
  //         console.log('agrego registro a la wallet');
  //       } else {
  //         // eslint-disable-next-line no-param-reassign
  //         // user.wallet = [];
  //         console.log('creo el primer registro de la wallet');
  //         const wallet = [Date.now()];
  //         this.db.wallet.addUserRegister(user.id, wallet);
  //       }
  //       const updatedUser = await user.updateSchedule({
  //         time: `${today.getHours()}:${today.getMinutes()}`,
  //         frecuency: user.schedule?.frecuency || 1,
  //         last: instantDate,
  //       });
  //       this.program(updatedUser);
  //     });
  //     this.schedules.push(job);
  //     // }
  //     logger.info('Se ha agregado correctamente la tarea');
  //   });
  // }

  async programMarketData() {
    const initialTime = Date.now();
    const scheduleTime = initialTime + 60000 * 120;
    const logger = this.logger.child({ function: 'programMarketData' });
    logger.info('Se agrega la tarea planificada de consultar la informacion');
    const market = await this.marketer.getMarketData();
    const marketId = market.id;
    const marketData = market.data;
    const where = { active: true, 'apiKey.0': { $exists: true } };
    const users = await this.db.user.getAllUsers({ where });
    users.forEach(async (user) => {
      // console.log(JSON.stringify(user.apiKey));
      let value = 0;
      const apiKey = await this.encryptor.decrypt(user.apiKey[0].apiKey);
      const apiSecret = await this.encryptor.decrypt(user.apiKey[0].apiSecret);
      logger.info(`Se consulta la información del usuario ${user.username}`);
      const account = await this.binance.getWalletStatus({ apiKey, apiSecret });
      // console.log(account);
      const promises = [];
      const wallet = { assets: [], value: 0 };
      account.balances.forEach(async (crypto) => {
        const assets = Number(crypto.free) + Number(crypto.locked);
        if (assets > 0) {
          if (marketData[crypto.asset]) {
            // console.log(crypto.asset, assets);
            const individualValue = (assets) * marketData[crypto.asset];
            wallet.assets.push({ coin: crypto.asset, value: individualValue, ammount: assets });
            value += individualValue;
            // console.log(value);
          } else {
            console.log(`missing price for ${crypto.asset}`);
            promises.push(new Promise((resolve, reject) => {
              try {
                marketData[crypto.asset] = this.binance.getTickerPrice(
                  crypto.asset,
                  apiKey,
                  apiSecret,
                ).then((price) => {
                  marketData[crypto.asset] = price;
                  value += (assets) * marketData[crypto.asset];
                  resolve();
                });
              } catch (err) {
                console.log(`price not found for ${crypto.asset}`);
                reject();
              }
            }));
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
