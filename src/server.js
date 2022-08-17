const express = require('express');
const config = require('config');
const errors = require('common-errors');
const cors = require('cors');
const { initialize } = require('express-openapi');
const swaggerUi = require('swagger-ui-express');
const openapiParser = require('swagger-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuid } = require('uuid');
const Scheduler = require('./components/scheduler/index');
const logger = require('./components/logger/logger').child({ module: 'Main' });
const Database = require('./components/database/index');
const RedisConnector = require('./components/redis-sessions/index');
const { verifySession } = require('./middlewares/authentication.middleware');
const ConnectorManager = require('./components/walletManager/index');
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
    openapiParser.dereference('src/api/openapi.yaml'),
    database.connect(),
    redis.connect(),
  ]);
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors());
  app.use(verifySession(redis));
  const marketer = new Marketer(logger, database);
  const encryptor = new Encryptor(logger);
  const connectorManager = new ConnectorManager({ logger, db: database, encryptor }, config.get('connectorManager'));
  const scheduler = new Scheduler({
    database,
    logger,
    connectorManager,
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
      connectorManager,
      encryptor,
      errors,
    },
    promiseMode: true,
    errorMiddleware: errorHandler,
    paths: './src/api/controllers',
  });

  app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(deps[0]));
  app.get('/api-doc', swaggerUi.setup(deps[0]));

  const PORT = config.app.port || 8080;

  const server = app.listen(PORT, () => {
    logger.info(`Server up and listening on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    logger.error('1', err);
  });
}

main();
