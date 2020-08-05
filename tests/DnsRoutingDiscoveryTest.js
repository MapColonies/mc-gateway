'use strict';

/**
 * unit test for prediction factory
 * **/
let expect      = require('chai').expect;
let blueBird    = require("bluebird");
let sinon       = require('sinon');
let assert      = require('assert');
let container   = require('../containerConfig');
let chai        = require('chai');
let chaiAsPromised = require('chai-as-promised');
let config      = require('config');
const routingTable = require('memory-cache');

chai.use(chaiAsPromised);

let DnsRoutingDiscovery = require('../services/dnsRoutingDiscovery').DnsRoutingDiscovery;
let dnsRoutingDiscovery;


describe('Dns Routing Discovery Test', function () {
    beforeEach(()=>{
        routingTable.clear();
        dnsRoutingDiscovery = new DnsRoutingDiscovery(container.get('logger'));
    })

    it('Test dnsRoutingDiscovery  - getRout for swagger url', function () {
        let url = "/docs";

        return dnsRoutingDiscovery.getRout(url)
            .then(result => {
                expect(result).to.equal("http://localhost:"+config.get('swagger').swPort);
            })
            .catch(err => {
                sinon.assert.fail("Test Failed with the following error: " + err);
            });

    });


    it('Test dnsRoutingDiscovery  - no discovery for already discovered url ', function () {

        let url = "/api/v1/serviceName";

        let dnsSocketMock = {
            query: function (query, port, host, cb) {

                let res = {};
                let err = null;
                res.answers = JSON.parse("[{\"name\":\"serviceName.localhost\",\"type\":\"SRV\",\"class\":1,\"ttl\":2735,\"flush\":false,\"data\":{\"priority\":10,\"weight\":100,\"port\":3007,\"target\":\"localhost\"}}]");
                res.additionals = JSON.parse("[{\"name\":\"serviceName.localhost\",\"type\":\"A\",\"class\":1,\"ttl\":2735,\"flush\":false,\"data\":\"localhost\"}]");
                cb(err,res);

            }
        }
        dnsRoutingDiscovery.dnsSocket = dnsSocketMock;

        let dsnSockerSpy = sinon.spy(dnsRoutingDiscovery.dnsSocket, "query");

        return dnsRoutingDiscovery.getRout(url)
            .then(result => {
                 return dnsRoutingDiscovery.getRout(url)
                    .then(result => {
                        assert(dsnSockerSpy.calledOnce);
                    })
            })
            .catch(err => {
                sinon.assert.fail("Test Failed with the following error: " + err);
            });

    });


    it('Test dnsRoutingDiscovery  - validate discovery result format ', function () {

        let url = "/api/v1/serviceName";

        let dnsSocketMock = {
            query: function (query, port, host, cb) {

                let res = {};
                let err = null;
                res.answers = JSON.parse("[{\"name\":\"serviceName.localhost\",\"type\":\"SRV\",\"class\":1,\"ttl\":2735,\"flush\":false,\"data\":{\"priority\":10,\"weight\":100,\"port\":3007,\"target\":\"localhost\"}}]");
                res.additionals = JSON.parse("[{\"name\":\"serviceName.localhost\",\"type\":\"A\",\"class\":1,\"ttl\":2735,\"flush\":false,\"data\":\"localhost\"}]");
                cb(err,res);
            }
        };
        dnsRoutingDiscovery.dnsSocket = dnsSocketMock;

        let dsnSockerSpy = sinon.spy(dnsRoutingDiscovery.dnsSocket, "query");

        return dnsRoutingDiscovery.getRout(url)
            .then(result => {
                expect(result).to.equal("http://localhost:3007/serviceName");
            })
            .catch(err => {
                sinon.assert.fail("Test Failed with the following error: " + err);
            });

    });



    it('Test dnsRoutingDiscovery  - discover returned no answers,  rout is rejected ', function (done) {

        let url = "/api/v1/serviceName";

        let dnsSocketMock = {
            query: function (query, port, host, cb) {

                let res = {};
                let err = null;
                res.answers = []
                res.additionals = []
                cb(err,res);
            }
        } ;
        dnsRoutingDiscovery.dnsSocket = dnsSocketMock;

        dnsRoutingDiscovery.getRout(url)
            .then(result => {
                sinon.assert.fail("Test Failed , expected promise to be rejected when discovery failes");
            })
            .catch(err => {
                done();
            });

    });



    it('Test dnsRoutingDiscovery  - discover returned error,  rout is rejected ', function (done) {

        let url = "/api/v1/serviceName";

        let dnsSocketMock = {
            query: function (query, port, host, cb) {

                let res = {};
                let err = {};
                err.message = "Query timed out";
                cb(err,res);
            }
        };
        dnsRoutingDiscovery.dnsSocket = dnsSocketMock;

        dnsRoutingDiscovery.getRout(url)
            .then(result => {
                sinon.assert.fail("Test Failed , expected promise to be rejected when discovery failes");
            })
            .catch(err => {
                done();
            });

    });


})
;
