// containerConfig.js
let config = require('config');
let logger = require('./loggerConfig');
let container = require('kontainer-di');
let routingDiscover = JSON.parse(config.useDns)
    ? require('./services/dnsRoutingDiscovery').DnsRoutingDiscovery
    : require('./services/basicRoutingDiscovery').BasicRoutingDiscovery;
let dynamicSwaggerCreator = require('./services/dynamicSwaggerCreator').DynamicSwaggerCreator;
let userAuthenticator = require('./services/userAuthenticator');
let helper = require('./services/helper');
let probeConfig = {};
var probe = require('@map-colonies/mc-probe').Probe;
let authenticatedServices = config.get('authenticatedServices');

//register services in container
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
