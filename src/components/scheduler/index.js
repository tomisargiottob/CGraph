const schedule = require('node-schedule');

class Scheduler {
  constructor(db, logger) {
    this.db = db;
    this.logger = logger.child({ module: 'Scheduler' });
    this.schedules = [];
  }

  async init() {
    const users = await this.db.user.getAllUsers();
    const logger = this.logger.child({ function: 'init' });
    logger.info('Scheduling requests for all users');
    users.forEach((user) => {
      this.program(user);
    });
  }

  program(user) {
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
              const updatedUser = await this.db.user.updateUser({
                id: user.id,
                schedule: {
                  time: user.schedule.time,
                  frecuency: user.schedule.frecuency,
                  last: scheduleTime,
                },
              });
              this.program(updatedUser);
            },
          );
          this.schedules.push(job);
        } else {
          const defaultTime = Date.now() + 20000;
          const job = schedule.scheduleJob(defaultTime, async () => {
            logger.warn('Ejecutar la consulta a binance en tiempo por defecto por que se paso su tiempo');
            const updatedUser = await this.db.user.updateUser({
              id: user.id,
              schedule: {
                time: user.schedule.time,
                frecuency: user.schedule?.frecuency,
                last: defaultTime,
              },
            });
            this.program(updatedUser);
          });
          this.schedules.push(job);
        }
      } else if (planned > today) {
        const job = schedule.scheduleJob(planned, async () => {
          logger.warn('Ejecutar la consulta a binance en tiempo planeado');
          const updatedUser = await this.db.user.updateUser({
            id: user.id,
            schedule: {
              time: user.schedule.time,
              frecuency: user.schedule.frecuency,
              last: planned.getTime(),
            },
          });
          this.program(updatedUser);
        });
        this.schedules.push(job);
      } else {
        const defaultTime = Date.now() + 20000;
        const job = schedule.scheduleJob(new Date(defaultTime), async () => {
          logger.warn('Ejecutar la consulta a binance en tiempo por defecto');
          const updatedUser = await this.db.user.updateUser({
            id: user.id,
            schedule: {
              time: user.schedule.time,
              frecuency: user.schedule?.frecuency,
              last: defaultTime,
            },
          });
          this.program(updatedUser);
        });
        this.schedules.push(job);
      }
      this.logger.info('Se ha agregado correctamente la tarea');
    } else {
      logger.info(`El usuario ${user.username} no tiene registrado schedule se le agrega por defecto `);
      const instantDate = new Date(Date.now() + 10000);
      const job = schedule.scheduleJob(instantDate, async () => {
        logger.warn('Ejecutar la consulta a binance');
        const updatedUser = await this.db.user.updateUser({
          id: user.id,
          schedule: {
            time: `${today.getHours()}:${today.getMinutes()}`,
            frecuency: user.schedule?.frecuency || 1,
            last: instantDate,
          },
        });
        this.program(updatedUser);
      });
      this.schedules.push(job);
      logger.info('Se ha agregado correctamente la tarea');
    }
  }

  reprogram(user) {
    const logger = this.logger.child({ function: 'reprogram' });
    // const nextUpdate = user.schedule.last + user.schedule.frecuency * 30 * 1000;
    const nextUpdate = Date.now() + 20000;
    const job = schedule.scheduleJob(
      nextUpdate,
      async () => {
        logger.warn({ user: user.username }, 'Ejecutar la consulta a binance');
        const updatedUser = await this.db.user.updateUser({
          id: user.id,
          schedule: {
            time: user.schedule.time,
            frecuency: user.schedule?.frecuency || 1,
            last: nextUpdate,
          },
        });
        this.reprogram(updatedUser);
      },
    );
    this.schedules.push(job);
  }
}

module.exports = Scheduler;
