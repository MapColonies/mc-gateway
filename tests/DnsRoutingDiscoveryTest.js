'use strict';

/**
 * unit test for prediction factory
 * **/
const expect = require('chai').expect;
const sinon = require('sinon');
const assert = require('assert');
const container = require('../containerConfig');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const config = require('config');
const routingTable = require('memory-cache');

chai.use(chaiAsPromised);

const DnsRoutingDiscovery = require('../services/dnsRoutingDiscovery').DnsRoutingDiscovery;
let dnsRoutingDiscovery;

describe('Dns Routing Discovery Test', function () {
  beforeEach(() => {
    routingTable.clear();
    dnsRoutingDiscovery = new DnsRoutingDiscovery(container.get('logger'));
  });

  it('Test dnsRoutingDiscovery  - getRout for swagger url', function () {
    const url = '/docs';

    return dnsRoutingDiscovery.getRout(url)
      .then(result => {
        expect(result).to.equal('http://localhost:' + config.get('server').port);
      })
      .catch(err => {
        sinon.assert.fail('Test Failed with the following error: ' + err);
      });
  });

  it('Test dnsRoutingDiscovery  - no discovery for already discovered url ', function () {
    const url = '/api/v1/serviceName';

    const dnsSocketMock = {
      query: function (query, port, host, cb) {
        const res = {};
        const err = null;
        res.answers = JSON.parse('[{"name":"serviceName.localhost","type":"SRV","class":1,"ttl":2735,"flush":false,"data":{"priority":10,"weight":100,"port":3007,"target":"localhost"}}]');
        res.additionals = JSON.parse('[{"name":"serviceName.localhost","type":"A","class":1,"ttl":2735,"flush":false,"data":"localhost"}]');
        cb(err, res);
      }
    };
    dnsRoutingDiscovery.dnsSocket = dnsSocketMock;

    const dsnSockerSpy = sinon.spy(dnsRoutingDiscovery.dnsSocket, 'query');

    return dnsRoutingDiscovery.getRout(url)
      .then(result => {
        return dnsRoutingDiscovery.getRout(url)
          .then(result => {
            assert(dsnSockerSpy.calledOnce);
          });
      })
      .catch(err => {
        sinon.assert.fail('Test Failed with the following error: ' + err);
      });
  });

  it('Test dnsRoutingDiscovery  - validate discovery result format ', function () {
    const url = '/api/v1/serviceName';

    const dnsSocketMock = {
      query: function (query, port, host, cb) {
        const res = {};
        const err = null;
        res.answers = JSON.parse('[{"name":"serviceName.localhost","type":"SRV","class":1,"ttl":2735,"flush":false,"data":{"priority":10,"weight":100,"port":3007,"target":"localhost"}}]');
        res.additionals = JSON.parse('[{"name":"serviceName.localhost","type":"A","class":1,"ttl":2735,"flush":false,"data":"localhost"}]');
        cb(err, res);
      }
    };
    dnsRoutingDiscovery.dnsSocket = dnsSocketMock;

    // const dsnSockerSpy = sinon.spy(dnsRoutingDiscovery.dnsSocket, 'query');

    return dnsRoutingDiscovery.getRout(url)
      .then(result => {
        expect(result).to.equal('http://localhost:3007/serviceName');
      })
      .catch(err => {
        sinon.assert.fail('Test Failed with the following error: ' + err);
      });
  });

  it('Test dnsRoutingDiscovery  - discover returned no answers,  rout is rejected ', function (done) {
    const url = '/api/v1/serviceName';

    const dnsSocketMock = {
      query: function (query, port, host, cb) {
        const res = {};
        const err = null;
        res.answers = [];
        res.additionals = [];
        cb(err, res);
      }
    };
    dnsRoutingDiscovery.dnsSocket = dnsSocketMock;

    dnsRoutingDiscovery.getRout(url)
      .then(result => {
        sinon.assert.fail('Test Failed , expected promise to be rejected when discovery failes');
      })
      .catch(() => {
        done();
      });
  });

  it('Test dnsRoutingDiscovery  - discover returned error,  rout is rejected ', function (done) {
    const url = '/api/v1/serviceName';

    const dnsSocketMock = {
      query: function (query, port, host, cb) {
        const res = {};
        const err = {};
        err.message = 'Query timed out';
        cb(err, res);
      }
    };
    dnsRoutingDiscovery.dnsSocket = dnsSocketMock;

    dnsRoutingDiscovery.getRout(url)
      .then(result => {
        sinon.assert.fail('Test Failed , expected promise to be rejected when discovery failes');
      })
      .catch(() => {
        done();
      });
  });
})
;
