'use strict';
var config = require('config');
var proxyConfig = config.get('proxy');
var routingTable = require('memory-cache');
var IRoutingDiscovery = require('./iRoutingDiscovery').IRoutingDiscovery;

module.exports.BasicRoutingDiscovery = class BasicRoutingDiscovery extends IRoutingDiscovery {
  constructor(logger) {
    super(logger);

    // rout for swagger urls
    const rout = 'http://localhost:' + config.get('swagger').swPort;
    routingTable.put('default', rout);
  }

  resolveServiceName(url) {
    const splitedUrl = url.split('/');
    return splitedUrl[parseInt(proxyConfig.basePathStartIndexInUrl) + 2];
  }

  getRout(url) {
    if (url.includes('docs')) {
      return Promise.resolve(routingTable.get('default'));
    }

    if (url.endsWith('readme.md') || (url.endsWith('changelog.md'))) {
      return Promise.resolve(routingTable.get('default'));
    }

    const serviceName = this.resolveServiceName(url);

    if (!serviceName) {
      throw new Error(`serviceName form url = ${url} not resolved `);
    }

    if ((serviceName === 'liveness') || (serviceName === 'readiness')) {
      return Promise.resolve(routingTable.get('default'));
    }

    let rout = routingTable.get(serviceName);
    if (!rout){
      rout = this.getServiceURL(serviceName);
      routingTable.put(serviceName, rout, parseInt(proxyConfig.routingTableTTL));
    }

    return Promise.resolve(rout);
  }

  async getServiceURL(serviceName) {
    return 'http://' + serviceName + '/' + serviceName;
  }
};
