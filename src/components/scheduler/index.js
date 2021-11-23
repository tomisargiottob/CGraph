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
    const where = { active: true, 'apiKey.0': { $exists: true } };
    const users = await this.db.user.getAllUsers({ where });
    const logger = this.logger.child({ function: 'init' });
    logger.info('Scheduling requests for all users');
    this.programMarketData();
    users.forEach((user) => {
      this.program(user);
    });
  }

  program(user) {
    user.apiKey.forEach(async (key) => {
      const apiKey = await this.encryptor.decrypt(key.apiKey);
      const apiSecret = await this.encryptor.decrypt(key.apiSecret);
      this.binance.getWalletStatus(apiKey, apiSecret);
      const today = new Date();
      const logger = this.logger.child({ function: 'program' });
      if (user.schedule && user.schedule.time && user.schedule.frecuency) {
        const parsedTime = user.schedule.time.split(':');
        const time = {
          hours: parsedTime[0],
          minutes: parsedTime[1],
        };
        const planned = new Date().setHours(time.hours, time.minutes);
        if (user.schedule.last) {
          if (user.schedule.last > (Date.now() - user.schedule.frecuency * 60 * 1000)) {
            const scheduleTime = user.schedule.last + user.schedule.frecuency * 60 * 1000;
            const job = schedule.scheduleJob(
              scheduleTime,
              async () => {
                logger.warn('Ejecutar la consulta a binance segun esquema de usuario');
                if (user.wallet) {
                  // user.wallet.push(scheduleTime);
                  console.log('agrego registro a la wallet');
                } else {
                  // eslint-disable-next-line no-param-reassign
                  console.log('creo el primer registro de la wallet');
                }
                const updatedUser = await user.updateSchedule(
                  {
                    time: user.schedule.time,
                    frecuency: user.schedule.frecuency,
                    last: scheduleTime,
                  },
                );
                this.program(updatedUser);
              },
            );
            this.schedules.push(job);
          } else {
            const defaultTime = Date.now() + 20000;
            const job = schedule.scheduleJob(defaultTime, async () => {
              logger.warn('Ejecutar la consulta a binance en tiempo por defecto por que se paso su tiempo');
              if (user.wallet) {
                console.log('agrego registro a la wallet');
              } else {
                // eslint-disable-next-line no-param-reassign
                // user.wallet = [];
                console.log('creo el primer registro de la wallet');
              }
              const updatedUser = await user.updateSchedule({
                time: user.schedule.time,
                frecuency: user.schedule.frecuency,
                last: defaultTime,
              });
              this.program(updatedUser);
            });
            this.schedules.push(job);
          }
        } else if (planned > today) {
          const job = schedule.scheduleJob(planned, async () => {
            logger.warn('Ejecutar la consulta a binance en tiempo planeado');
            if (user.wallet) {
              console.log('agrego registro a la wallet');
            } else {
              // eslint-disable-next-line no-param-reassign
              // user.wallet = [];
              console.log('creo el primer registro de la wallet');
            }
            const updatedUser = await user.updateSchedule({
              time: user.schedule.time,
              frecuency: user.schedule.frecuency,
              last: planned.getTime(),
            });
            this.program(updatedUser);
          });
          this.schedules.push(job);
        } else {
          const defaultTime = Date.now() + 20000;
          const job = schedule.scheduleJob(new Date(defaultTime), async () => {
            logger.warn('Ejecutar la consulta a binance en tiempo por defecto');
            if (user.wallet) {
              console.log('agrego registro a la wallet');
            } else {
              // eslint-disable-next-line no-param-reassign
              // user.wallet = [];
              console.log('creo el primer registro de la wallet');
            }
            const updatedUser = await user.updateSchedule({
              time: user.schedule.time,
              frecuency: user.schedule.frecuency,
              last: defaultTime,
            });
            this.program(updatedUser);
          });
          this.schedules.push(job);
        }
      } else {
        const instantDate = Date.now() + 10000;
        const job = schedule.scheduleJob(instantDate, async () => {
          logger.warn(`El usuario ${user.username} no tiene registrado schedule se ha ejecutado en tiempo por defecto`);
          if (user.wallet) {
            console.log('agrego registro a la wallet');
          } else {
            // eslint-disable-next-line no-param-reassign
            // user.wallet = [];
            console.log('creo el primer registro de la wallet');
            const wallet = [Date.now()];
            this.db.wallet.addUserRegister(user.id, wallet);
          }
          const updatedUser = await user.updateSchedule({
            time: `${today.getHours()}:${today.getMinutes()}`,
            frecuency: user.schedule?.frecuency || 1,
            last: instantDate,
          });
          this.program(updatedUser);
        });
        this.schedules.push(job);
      }
      logger.info('Se ha agregado correctamente la tarea');
    });
  }

  programMarketData() {
    const scheduleTime = Date.now() + 60000;
    const logger = this.logger.child({ function: 'programMarketData' });
    logger.info('Se agrega la tarea planificada de consultar la informacion');
    schedule.scheduleJob(
      scheduleTime,
      async () => {
        logger.info('Se consulta la información del mercado');
        await this.marketer.getMarketData();
        this.programMarketData();
      },
    );
  }
}

module.exports = Scheduler;
