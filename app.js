'use strict';

const express = require('express');
const container = require('./containerConfig');
const config = require('config');

const logger = container.get('logger');
const probe = container.get('probe');
const swaggerHandler = container.get('swaggerHandler');
const proxyHandler = container.get('proxyHandler');

const swaggerConfig = config.get('swagger');

const app = express();

module.exports = app;

const errorOps = (msg, err) => {
  logger.log('error', `${msg} ${err.message || err}`);
  probe.readyFlag = false;
  probe.liveFlag = false;
  probe.addError(err);
};

// init must done without errors in order to be readiness
async function main () {
  try {
    swaggerHandler.init(app);
    proxyHandler.init(app);
    const serverPort = config.get('server').port;
    try {
      await probe.start(app, serverPort);
      logger.log('info', 'service started at http://localhost:' + serverPort);
      logger.log('info', `swagger started at http://localhost:${serverPort}/${swaggerConfig.urlPath}`);
      probe.readyFlag = true;
    } catch (err) {
      errorOps(`Cannot start server ${err}`);
    }
  } catch (err) {
    errorOps('Error: ', err);
  }
}

main();
