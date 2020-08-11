const IRoutingDiscovery = require('./iRoutingDiscovery').IRoutingDiscovery;
const config = require('config');

module.exports.ManualRoutingDiscovery = class ManualRoutingDiscovery extends IRoutingDiscovery {
  constructor(logger) {
    super(logger);
    this._discoveryConfig = config.manualDiscovery;
    this._serviceMap = this._discoveryConfig.services;
    this._proxyConfig = config.proxy;
  }

  getRout(url){
    const serviceName = this.resolveServiceName(url);
    return this.getServiceURL(serviceName);
  }

  resolveServiceName(url) {
    const splitedUrl = url.split('/');
    return splitedUrl[parseInt(this._proxyConfig.basePathStartIndexInUrl) + 2];
  }

  async getServiceURL(serviceName) {
    const service = this._serviceMap[serviceName];
    if (!service){
      return Promise.reject(new Error(`unmapped service: ${serviceName}`));
    }
    return Promise.resolve(service);
  }
};
