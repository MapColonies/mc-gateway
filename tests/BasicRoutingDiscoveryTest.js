'use strict';

/**
 * unit test for prediction factory
 * **/
var expect = require('chai').expect;
var sinon = require('sinon');
var container = require('../containerConfig');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var config = require('config');
const routingTable = require('memory-cache');

var BasicRoutingDiscovery = require('../services/basicRoutingDiscovery').BasicRoutingDiscovery;
let basicRoutingDiscovery;

describe('Basic Routing Discovery Tests', function () {
  beforeEach(() => {
    routingTable.clear();
    basicRoutingDiscovery = new BasicRoutingDiscovery(container.get('logger'));
  });

  it('Test basicRoutingDiscovery  - getRout for swagger url', function () {
    var url = '/docs';

    return basicRoutingDiscovery.getRout(url)
      .then(result => {
        expect(result).to.equal('http://localhost:' + config.get('server').port);
      })
      .catch(err => {
        sinon.assert.fail('Test Failed with the following error: ' + err);
      });
  });

  it('Test basicRoutingDiscovery  - service discovery', function () {
    var url = '/api/v1/overlays';

    return basicRoutingDiscovery.getRout(url)
      .then(rout => {
        expect(rout).to.equal('http://overlays/overlays');
      });
  });
});
