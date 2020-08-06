'use strict';

module.exports.IRoutingDiscovery = class IRoutingDiscovery {
  constructor(logger) {
    this.logger = logger;
  }

  getRout(url){}

  resolveServiceName(url) {}

  async getServiceURL(serviceName) {}
};
