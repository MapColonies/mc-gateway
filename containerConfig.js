// containerConfig.js
const config = require('config');
const container = require('kontainer-di');
const logger = require('./loggerConfig');
const dynamicSwaggerCreator = require('./services/dynamicSwaggerCreator').DynamicSwaggerCreator;
const userAuthenticator = require('./services/userAuthenticator');
const helper = require('./services/helper');
const probe = require('@map-colonies/mc-probe').Probe;
const swaggerHandler = require('./requestHandlers/swaggerHandler').SwaggerHandler;
const proxyHandler = require('./requestHandlers/proxyHandler').ProxyHandler;

const routingDiscover = JSON.parse(config.useDns)
  ? require('./services/dnsRoutingDiscovery').DnsRoutingDiscovery
  : require('./services/basicRoutingDiscovery').BasicRoutingDiscovery;

const probeConfig = {};
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
container.register('swaggerHandler', ['logger', 'dynamicSwaggerCreator', 'helper'], swaggerHandler);
container.register('proxyHandler', ['logger', 'routingDiscover', 'userAuthenticator'], proxyHandler);

module.exports = container;
