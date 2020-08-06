'use strict';

const config = require('config');
const MCLogger = require('@map-colonies/mc-logger').MCLogger;
const logConfig = config.get('log');
const serviceData = require('./package.json');

const logger = new MCLogger(logConfig, serviceData);

module.exports = logger;
