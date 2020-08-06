'use strict';

/**
 * unit test for prediction factory
 * **/
const expect = require('chai').expect;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const container = require('../containerConfig');
const UserAuthenticator = require('../services/userAuthenticator');

chai.use(chaiAsPromised);

const authenticatedServices = container.get('authenticatedServices');
const userAuthenticator = new UserAuthenticator(container.get('logger'), authenticatedServices);

describe('UserAuthenticator check user protection Test', function () {
  const protectedList = authenticatedServices.servicesList;
  it('Test unprotected service URL without userName - should pass ok', function () {
    const url = '/test/service/' + protectedList[0] + 'demo?' + protectedList[0];
    expect(userAuthenticator.checkUser({ url: url, headers: { 'x-username': '' } })).to.equals(true);
  });

  it('Test protected service URL with userName - should pass OK', function () {
    const url = '/test/service/' + protectedList[protectedList.length - 1] + '/doSomething?abcd';
    expect(userAuthenticator.checkUser({ url: url, headers: { 'x-username': 'kuku' } })).to.equals(true);
  });

  it('Test unprotected service URL with userName - should pass ok', function () {
    const url = '/test/service/' + protectedList[0] + 'demo?' + protectedList[0];
    expect(userAuthenticator.checkUser({ url: url, headers: { 'x-username': 'dontCare' } })).to.equals(true);
  });

  it('Test protected service URL without userName - should not pass - user name is required', function () {
    const url = '/test/service/' + protectedList[protectedList.length - 1] + '/doSomething?abcd';
    expect(userAuthenticator.checkUser({ url: url, headers: { 'x-username': '' } })).to.equals(false);
  });

  it('Test catastrophe - should return false', function () {
    expect(userAuthenticator.checkUser({ noUrl: 'noUrl' })).to.equals(false);
  });
});
