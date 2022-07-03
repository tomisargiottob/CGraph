const express = require('express');
const config = require('config');
const cors = require('cors');
const { initialize } = require('express-openapi');
const swaggerUi = require('swagger-ui-express');
const openapiParser = require('swagger-parser');
const swaggerStats = require('swagger-stats');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuid } = require('uuid');
const Scheduler = require('./components/scheduler/index');
const logger = require('./components/logger/logger').child({ module: 'Main' });
const Database = require('./components/database/index');
const RedisConnector = require('./components/redis-sessions/index');
const { verifySession } = require('./middlewares/authentication.middleware');
const BinanceClient = require('./components/connectors/binance/index');
const Encryptor = require('./components/crypto/index');
const Marketer = require('./components/marketer/index');

function errorHandler(err, req, res, next) {
  if (err.status === 400) {
    logger.info({ method: req.method, endpoint: req.url }, 'Request did not pass the validation schema');
    res.status(400).json({ errors: err.errors });
  } else {
    next(err);
  }
}

async function main() {
  const database = new Database(logger);
  const redis = new RedisConnector();
  const deps = await Promise.all([
    openapiParser.dereference('src/api/openapi.yml'),
    database.connect(),
    redis.connect(),
  ]);
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors());
  app.use(verifySession(redis));
  const marketer = new Marketer(logger, database);
  const binance = new BinanceClient(logger);
  const encryptor = new Encryptor(logger);
  const scheduler = new Scheduler({
    database,
    logger,
    encryptor,
    binance,
    marketer,
  });
  await scheduler.init();
  initialize({
    app,
    apiDoc: deps[0],
    dependencies: {
      db: database,
      redis,
      logger,
      jwt,
      config,
      bcrypt,
      uuid,
      scheduler,
      binance,
      encryptor,
    },
    promiseMode: true,
    errorMiddleware: errorHandler,
    paths: './src/api/controllers',
  });

  app.use(swaggerStats.getMiddleware({ swaggerSpec: deps[0] })); // metricas en /swagger-stats/stats
  app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(deps[0]));

  const PORT = config.app.port || 8080;

  const server = app.listen(PORT, () => {
    logger.debug(`Server up and listening on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    logger.error('1', err);
  });
}

main();
