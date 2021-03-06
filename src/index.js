const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const httpStatus = require('http-status-codes');
const winston = require('winston');
const Ajv = require('ajv');
const { v4: uuid } = require('uuid');
const { createContainer, asValue, asFunction } = require('awilix');

const { routerCarV1, routerHealth } = require('./routes');
const { handlerCarV1, handlerDefault } = require('./handlers');
const { ModelCar } = require('./models');
const { mongoClient, logger } = require('./lib');
const { ApiError } = require('./util');
const { constErrors } = require('./const');
const config = require('./config');

const ajv = new Ajv();

const container = createContainer();

container.register({
  winston: asValue(winston),
  httpStatus: asValue(httpStatus),
  mongoose: asValue(mongoose),
  ajv: asValue(ajv),
  uuid: asValue(uuid),
  express: asValue(express),

  ModelCar: asFunction(ModelCar).singleton(),

  config: asValue(config),
  constErrors: asValue(constErrors),

  mongoClient: asFunction(mongoClient).singleton(),

  ApiError: asValue(ApiError),
  logger: asFunction(logger).singleton(),

  routerCarV1: asFunction(routerCarV1).singleton(),
  routerHealth: asFunction(routerHealth).singleton(),

  handlerCar: asFunction(handlerCarV1).singleton(),
  handlerDefault: asFunction(handlerDefault).singleton()
});

const app = container.resolve('express')();

const log = container.resolve('logger')(app);
const { preRequest, successHandler, errorHandler } = container.resolve(
  'handlerDefault'
);
app
  .use(bodyParser.json())
  .use(preRequest)
  .use('/api', container.resolve('routerCarV1'))
  .use('/health', container.resolve('routerHealth'))
  .use(successHandler);

// only use the error handler for /api endpoint since we expect a different payload on health errors
app.use('/api', errorHandler);

const server = app.listen(config.GLOBAL.PORT);

server.stopServer = async () => {
  return new Promise(async resolve => {
    const mongoDbClient = container.resolve('mongoClient');
    await mongoDbClient.disconnect();
    server.close(resolve);
  });
};

log.info('successfully started application server', {
  port: config.GLOBAL.PORT
});
module.exports = { server, container };
