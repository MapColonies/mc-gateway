const swaggerUi = require('swagger-ui-express');
const config = require('config');

module.exports.SwaggerHandler = class SwaggerHandler {
  constructor(logger, dynamicSwaggerCreator, helper){
    this._logger = logger;
    this._dynamicSwaggerCreator = dynamicSwaggerCreator;
    this._helper = helper;
    this._dynamicSwaggerDelayInSec = config.get('dynamicSwaggerDelayInSec');
    this._firstLoad = true;
    this._swaggerConfig = config.get('swagger');
  }

  init(app, firsLoadCb){
    this.generateSwagger(() => {
      if (firsLoadCb){
        firsLoadCb();
      }
    });
    const swaggerPath = this._swaggerConfig.urlPath;
    app.use(swaggerPath, (req, res, next) => {
      req.swaggerDoc = this._swaggerDoc;
      req.swaggerDoc.host = this._swaggerConfig.swDomain + this._swaggerConfig.serviceInst + (this._swaggerConfig.namespace ? ('-' + this._swaggerConfig.namespace) : '');

      next();
    }, swaggerUi.serve, swaggerUi.setup());
    this._logger.info(`added swagger at ${swaggerPath}`);
  }

  async generateSwagger(firsLoadCb) {
    this._logger.log('debug', 'start init swaggger document');
    while (!this._dynamicSwaggerCreator.isReadAll()) {
      await this._partialLoadSwagger();
      if (this._firstLoad && this._swaggerDoc){
        this._firstLoad = false;
        firsLoadCb();
      }
    }
    this._logger.log('info', 'all servers are up and running ');
    return Promise.resolve();
  }

  async _partialLoadSwagger() {
    let successServicesSize, swaggerJson;
    do {
      try {
        successServicesSize = this._dynamicSwaggerCreator.getSuccessServicesSize();
        swaggerJson = null;
        swaggerJson = await this._dynamicSwaggerCreator.createDynamicSwagger();
        if (!swaggerJson) {
          if (successServicesSize === this._dynamicSwaggerCreator.getSuccessServicesSize()) {
            if (this._dynamicSwaggerCreator.getSuccessServicesSize() === 0) {
              await this._helper.sleep(this._dynamicSwaggerDelayInSec * 1000);
            }
          }
        }
      } catch (e) {
        this._logger.log('error', `Error initSwagggerServer: ${e.message || e}`);
      }
    } while (successServicesSize === this._dynamicSwaggerCreator.getSuccessServicesSize());
    this._swaggerDoc = swaggerJson;
    this._logger.log('info', 'Done partial init swaggger server');
    return Promise.resolve();
  }
};
