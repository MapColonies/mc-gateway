'use strict';
var dns = require('dns-socket');
var packet = require('dns-packet');
var config = require('config');
var proxyConfig = config.get('proxy');
var routingTable = require('memory-cache');
var IRoutingDiscovery = require('./iRoutingDiscovery').IRoutingDiscovery;
const domain = config.get('proxy').domain;

module.exports.DnsRoutingDiscovery = class DnsRoutingDiscovery extends IRoutingDiscovery {
  constructor(logger) {
    super(logger);
    this.dnsSocket = dns();

    // rout for swagger urls
    const rout = 'http://localhost:' + config.get('server').port;
    routingTable.put('default', rout);
  }

  resolveServiceName(url) {
    const splitedUrl = url.split('/');
    return splitedUrl[parseInt(proxyConfig.basePathStartIndexInUrl) + 2];
  }

  getRout(url) {
    const serviceName = this.resolveServiceName(url);

    if (url.startsWith('/docs') || (serviceName === 'liveness') || (serviceName === 'readiness')) {
      return Promise.resolve(routingTable.get('default'));
    }

    if (url.endsWith('readme.md') || (url.endsWith('changelog.md'))) {
      return Promise.resolve(routingTable.get('default'));
    }

    if (!serviceName) {
      throw new Error(`serviceName form url = ${url} not resolved `);
    }

    const cachedUrl = routingTable.get(serviceName);
    if (cachedUrl) {
      return Promise.resolve(cachedUrl);
    }

    return this.queryDNS(serviceName);
  }

  queryDNS(serviceName) {
    const self = this;
    return new Promise(function (resolve, reject) {
      self.dnsSocket.query({
        flags: packet.RECURSION_DESIRED,
        questions: [{
          type: 'srv',
          name: serviceName + '.' + domain
        }]
      }, 53, config.get('proxy').dnsHost,
      function (err, res) {
        if (err || (!res.answers) || res.answers.length === 0) {
          if (err) {
            self.logger.log('error', 'Failed on dns lookup for name: %s with error:%s', serviceName + '.' + domain, err);
          } else {
            self.logger.log('error', 'Failed on dns lookup for name: %s, address not found.', serviceName + '.' + domain);
          }
          return reject(new Error(`Failed on dns lookup for name: ${serviceName}.${domain}, address not found.`));
        }

        const routingPort = res.answers[0].data.port;

        let routingHost;
        if (res.additionals.length > 0) {
          routingHost = res.additionals[0].data;
        } else {
          routingHost = res.answers[0].data.target;
        }

        const rout = 'http://' + routingHost + ':' + routingPort + '/' + serviceName;
        self.logger.log('debug', 'Dns lookup success for name: %s, rout address:%s', serviceName + '.' + domain, rout);
        routingTable.put(serviceName, rout, parseInt(proxyConfig.routingTableTTL));
        return resolve(rout);
      });
    });
  }

  async getServiceURL(serviceName) {
    return await this.queryDNS(serviceName);
  }
};
