'use strict';
/**
 * Get a list of services names and
 * return false if service URL doesn't contain username in header.
 * @type {module.UserAuthenticator}
 */
module.exports = class UserAuthenticator {

    constructor(logger, authenticatedServices) {
        this.logger = logger;
        this._active = (String(authenticatedServices.active) == 'true');

        this._serviceList = authenticatedServices.servicesList;
        if (this._serviceList === "") this._serviceList = []; // solve the problem that the confd can't be initiated with array.
    }

    checkUser(req) {
        let ret = true;

        if (this._active) {
            const paramName = 'x-username';
            try {
                let url = req.url;
                url = url.substr(0, (url + '?').indexOf('?'));

                for (let srvc of this._serviceList) {
                    if (url.indexOf('/' + srvc + "/") > -1) {
                        ret = (!!req.headers[paramName]);  // !! convert to true/false
                        this.logger.log("debug", `checkUser ${ret ? '' : 'NOT '}approved for: ${req.url}.`);
                        break;
                    }
                }
            } catch (err) {
                this.logger.log("error", `checkUser failed with error "${err}" for: ${JSON.stringify(req)}.`);
                ret = false;
            }
        }
        return ret;
    }
};

