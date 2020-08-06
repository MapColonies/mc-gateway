// containerConfig.js
const config = require('config');
const logger = require('./loggerConfig');
const container = require('kontainer-di');
const routingDiscover = JSON.parse(config.useDns)
  ? require('./services/dnsRoutingDiscovery').DnsRoutingDiscovery
  : require('./services/basicRoutingDiscovery').BasicRoutingDiscovery;
const dynamicSwaggerCreator = require('./services/dynamicSwaggerCreator').DynamicSwaggerCreator;
const userAuthenticator = require('./services/userAuthenticator');
const helper = require('./services/helper');
const probeConfig = {};
var probe = require('@map-colonies/mc-probe').Probe;
const authenticatedServices = config.get('authenticatedServices');

// register services in container
container.register('logger', [], logger);
container.register('helper', ['logger'], helper);
container.register('probeConfig', [], probeConfig);
container.register('probe', ['logger', 'probeConfig'], probe);
container.register('servicesConfig', [], config.get('servicesList'));
container.register('authenticatedServices', [], authenticatedServices);
container.register('routingDiscover', ['logger'], routingDiscover);
container.register('dynamicSwaggerCreator', ['logger', 'servicesConfig', 'routingDiscover'], dynamicSwaggerCreator);
container.register('userAuthenticator', ['logger', 'authenticatedServices'], userAuthenticator);

module.exports = container;
