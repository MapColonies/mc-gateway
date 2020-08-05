'use strict';

let config = require('config');
let json2Yaml = require('json2yaml');
let fs = require('fs');
let syncRequest = require('sync-request');
let jsyaml = require('js-yaml');
let _ = require('lodash');

module.exports.DynamicSwaggerCreator = class DynamicSwaggerCreator {
    constructor(logger, servicesList, routingDiscover) {
        this._logger = logger;
        this._servicesList = servicesList;
        this._routingDiscover = routingDiscover;
        this._hostOfServicesInside = config.get('hostOfServicesInside');
        this._hostOfServicesOutside = config.get('hostOfServicesOutside');
        this._successServices = new Map();
        this.isFirst = true;
    }

    getSuccessServicesSize() {
        return this._successServices.size;
    }

    isReadAll() {
        this._logger.log('debug', `success services size ${this._successServices.size},services list size ${this._servicesList.length}`);
        return this._successServices.size === this._servicesList.length;
    }

    async createDynamicSwagger() {
        let combinedJsonYaml, originalYaml;
        let isError = false;
        try {
            this._logger.log('debug', `start creating dynamic swagger`);
            let spec = fs.readFileSync('./api/swagger/swagger.yaml', 'utf8');
            combinedJsonYaml = jsyaml.safeLoad(spec);
            originalYaml = json2Yaml.stringify(combinedJsonYaml);
            let serviceHandlers = [];
            _.forEach(this._servicesList, service => {
                if (!this._successServices.has(service)) {
                    serviceHandlers.push(this.retriveServiceYaml(combinedJsonYaml, service));
                }
            });

            await Promise.all(serviceHandlers);
            isError = false;


        } catch (err) {
            this._logger.log('error', `Error: ${err.message || err}`);
            isError = true;
        } finally {
            let yamlText = json2Yaml.stringify(combinedJsonYaml);
            if (yamlText !== originalYaml) {
                this._logger.log('debug', `updating swagger.yaml`);
                // json2Yaml adds '---' at the beginning of the text and swagger don't validate this.
                // thats why we remove the 3 first chars in the yamlText
                if (this.isFirst) {
                    yamlText = yamlText.substring(3);
                    this.isFirst = false;
                }

                fs.writeFileSync('./api/swagger/swagger.yaml', yamlText);
            }
        }
        return isError;
    }

    retriveServiceYaml(combinedJsonYaml, service) {
        return this._routingDiscover.getServiceURL(service).then(url => {
            let serviceRequest = syncRequest('GET', url + '/api-docs');
            if (serviceRequest.statusCode === 200) {
                let jsonBody = JSON.parse(serviceRequest.getBody());
                let keys = Object.keys(jsonBody.paths);
                keys.forEach(key => {
                    if (!combinedJsonYaml.paths[key]) {
                        combinedJsonYaml.paths[key] = jsonBody.paths[key];
                        if (combinedJsonYaml.paths[key].$ref) {
                            combinedJsonYaml.paths[key].$ref = combinedJsonYaml.paths[key].$ref.replace(this._hostOfServicesInside, this._hostOfServicesOutside);
                        }
                    }
                });
                if (jsonBody.definitions) {
                    if (!combinedJsonYaml.definitions) {
                        combinedJsonYaml.definitions = {};
                    }
                    let definitionsKeys = Object.keys(jsonBody.definitions);
                    definitionsKeys.forEach(key => {
                        if (!combinedJsonYaml.definitions[key]) {
                            combinedJsonYaml.definitions[key] = jsonBody.definitions[key];
                        }
                    });
                }
                this._successServices.set(service, true);
                this._logger.log('debug', `Service name: ${service} retrieve service yaml`);
            }
            else {
                this._logger.log('error', `Service name: ${service} return with status code: ${serviceRequest.statusCode}`);
            }
        }).catch(err => {
            this._logger.log('error', `Error: ${err.message}, service name: ${service}`);
            throw new Error(`Error in service ${service}`);

        })
    }
}
