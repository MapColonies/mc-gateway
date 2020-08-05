'use strict';

/**
 * unit test for prediction factory
 * **/
let expect = require('chai').expect;
let sinon = require('sinon');
let assert = require('assert');
let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');

let fs = require('fs');

let container = require('../containerConfig');
let UserAuthenticator = require('../services/userAuthenticator');

chai.use(chaiAsPromised);

let authenticatedServices = container.get('authenticatedServices');
let userAuthenticator = new UserAuthenticator(container.get('logger'), authenticatedServices);

describe('UserAuthenticator check user protection Test', function () {

    let protectedList = authenticatedServices.servicesList;
    it('Test unprotected service URL without userName - should pass ok', sinon.test(function () {
        let url = "/test/service/" + protectedList[0] + "demo?" + protectedList[0];
        expect(userAuthenticator.checkUser({url: url, headers: {"x-username": ""}})).to.equals(true);

    }));

    it('Test protected service URL with userName - should pass OK', sinon.test(function () {
        let url = "/test/service/" + protectedList[protectedList.length - 1] + "/doSomething?abcd";
        expect(userAuthenticator.checkUser({url: url, headers: {"x-username": "kuku"}})).to.equals(true);

    }));

    it('Test unprotected service URL with userName - should pass ok', sinon.test(function () {
        let url = "/test/service/" + protectedList[0] + "demo?" + protectedList[0];
        expect(userAuthenticator.checkUser({url: url, headers: {"x-username": "dontCare"}})).to.equals(true);

    }));

    it('Test protected service URL without userName - should not pass - user name is required', sinon.test(function () {
        let url = "/test/service/" + protectedList[protectedList.length - 1] + "/doSomething?abcd";
        expect(userAuthenticator.checkUser({url: url, headers: {"x-username": ""}})).to.equals(false);

    }));

    it('Test catastrophe - should return false', sinon.test(function () {
        expect(userAuthenticator.checkUser({noUrl: "noUrl"})).to.equals(false);

    }));

});
