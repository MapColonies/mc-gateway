'use strict';

let config = require('config');
let MCLogger = require('@map-colonies/mc-logger').MCLogger;
let logConfig = config.get('log');
let serviceData = require('./package.json');


let logger = new MCLogger(logConfig, serviceData);

module.exports = logger;
