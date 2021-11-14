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
const logger = require('./components/logger/logger');
const database = require('./components/database/index');
const { verifyToken } = require('./middlewares/authentication.middleware');

function errorHandler(err) {
  console.log(JSON.stringify(err, null, 2));
}
async function main() {
  const deps = await Promise.all([
    openapiParser.dereference('src/api/openapi.yml'),
    database.connect(),
  ]);
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors());
  app.use(verifyToken);
  // app.use(enteringRequest); // DEVELOP
  initialize({
    app,
    apiDoc: deps[0],
    dependencies: {
      db: database,
      logger,
      jwt,
      config,
      bcrypt,
      uuid,
    },
    promiseMode: true,
    errorMiddleware: errorHandler,
    paths: './src/api/controllers',
  });

  app.use(swaggerStats.getMiddleware({ swaggerSpec: deps[0] })); // metricas en /swagger-stats/stats
  app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(deps[0]));

  const PORT = config.app.port || 8080;

  const server = app.listen(PORT, () => {
    logger.info(`Server up and listening on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    logger.error('1', err);
  });
}

main();
