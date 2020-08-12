'use strict';

const config = require('config');
const fs = require('fs');
const syncRequest = require('sync-request');
const jsyaml = require('js-yaml');

module.exports.DynamicSwaggerCreator = class DynamicSwaggerCreator {
  constructor(logger, servicesList, routingDiscover) {
    this._logger = logger;
    this._servicesList = servicesList;
    this._routingDiscover = routingDiscover;
    this._hostOfServicesInside = config.get('hostOfServicesInside');
    this._hostOfServicesOutside = config.get('hostOfServicesOutside');
    this._successServices = new Map();
    this._swaggerDoc = null;
  }

  getSuccessServicesSize() {
    return this._successServices.size;
  }

  isReadAll() {
    this._logger.log('debug', `success services size ${this._successServices.size},services list size ${this._servicesList.length}`);
    return this._successServices.size === this._servicesList.length;
  }

  async createDynamicSwagger() {
    let combinedJsonYaml;
    try {
      this._logger.log('debug', 'start creating dynamic swagger');
      if (!this._swaggerDoc){
        const spec = fs.readFileSync('./api/swagger/swagger.yaml', 'utf8');
        combinedJsonYaml = jsyaml.safeLoad(spec);
        this._swaggerDoc = combinedJsonYaml;
      } else {
        combinedJsonYaml = this._swaggerDoc;
      }
      const serviceHandlers = [];
      this._servicesList.forEach(service => {
        if (!this._successServices.has(service)) {
          serviceHandlers.push(this._retrieveServiceYaml(combinedJsonYaml, service));
        }
      });

      await Promise.all(serviceHandlers);
      this._swaggerDoc = combinedJsonYaml;
      return combinedJsonYaml;
    } catch (err) {
      this._logger.log('error', `Error: ${err.message || err}`);
      return null;
    }
  }

  _retrieveServiceYaml(combinedJsonYaml, service) {
    return this._routingDiscover.getServiceURL(service).then(url => {
      const serviceRequest = syncRequest('GET', url + '/api-json');
      if (serviceRequest.statusCode === 200) {
        const jsonBody = JSON.parse(serviceRequest.getBody());
        const keys = Object.keys(jsonBody.paths);
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
          const definitionsKeys = Object.keys(jsonBody.definitions);
          definitionsKeys.forEach(key => {
            if (!combinedJsonYaml.definitions[key]) {
              combinedJsonYaml.definitions[key] = jsonBody.definitions[key];
            }
          });
        }
        const components = jsonBody.components;
        if (components){
          if (!combinedJsonYaml.components) {
            combinedJsonYaml.components = {};
          }
          const schemas = components.schemas;
          if (schemas){
            if (!combinedJsonYaml.components.schemas){
              combinedJsonYaml.components.schemas = {};
            }
            const schemasKeys = Object.keys(schemas);
            schemasKeys.forEach(key => {
              if (!combinedJsonYaml.components.schemas[key]){
                combinedJsonYaml.components.schemas[key] = schemas[key];
              }
            });
          }
        }
        this._successServices.set(service, true);
        this._logger.log('debug', `Service name: ${service} retrieve service yaml`);
      } else {
        this._logger.log('error', `Service name: ${service} return with status code: ${serviceRequest.statusCode}`);
      }
    }).catch(err => {
      this._logger.log('error', `Error: ${err.message}, service name: ${service}`);
      throw new Error(`Error in service ${service}`);
    });
  }
};
