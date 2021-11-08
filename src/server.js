const express = require('express');
const config = require('config');
const cors = require('cors');
const { initialize } = require('express-openapi');
const swaggerUi = require('swagger-ui-express');
const openapiParser = require('swagger-parser');
const swaggerStats = require('swagger-stats');
const database = require('./components/database');
const enteringRequest = require('./middlewares/testingmiddleware')


async function main (){
  const deps = await Promise.all([
    openapiParser.dereference('src/api/openapi.yml'),
    database.connect(),
  ])
  const app = express();
  app.use(enteringRequest); // DEVELOP
  initialize({
    app,
    apiDoc: deps[0],
    paths: './src/controllers'
  });
  
  app.use(cors())
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.get('/',(req,res) => {
    res.send('Hola Mundo')
  })

  app.use(swaggerStats.getMiddleware({swaggerSpec: deps[0]})); //metricas en /swagger-stats/stats
  app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(deps[0]));

  const PORT = config.app.port || 8080;
  
  const server = app.listen(PORT, () => {
    console.log(`Server up and listening on http://localhost:${PORT}`);
  });
  
  server.on('error', (err) => {
    console.log(err);
  });
}

main();