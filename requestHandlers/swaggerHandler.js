const swaggerUi = require('swagger-ui-express');
const config = require('config');

module.exports.SwaggerHandler = class SwaggerHandler {
  constructor(logger, dynamicSwaggerCreator, helper){
    this._logger = logger;
    this._dynamicSwaggerCreator = dynamicSwaggerCreator;
    this._helper = helper;
    this._dynamicSwaggerDelayInSec = config.get('dynamicSwaggerDelayInSec');
    this._swaggerConfig = config.get('swagger');
  }

  init(app){
    // async create and update swagger until all services are loaded
    this.generateSwagger();

    // create middleware to inject swagger content from memory and override host server
    let setSwagger = (req, res, next) => {
      req.swaggerDoc = this._swaggerDoc;
      req.swaggerDoc.host = this._swaggerConfig.swDomain + this._swaggerConfig.serviceInst + (this._swaggerConfig.namespace ? ('-' + this._swaggerConfig.namespace) : '');
      next();
    };
    setSwagger = setSwagger.bind(this);
    // register swagger ui handler
    const swaggerJsonPath = this._swaggerConfig.jsonPath;
    if (swaggerJsonPath && swaggerJsonPath !== ''){
      app.get(swaggerJsonPath, setSwagger, (req, res) => {
        res.json(req.swaggerDoc);
      });
    }
    const swaggerPath = this._swaggerConfig.urlPath;
    // register swagger json handler
    app.use(swaggerPath, setSwagger, swaggerUi.serve, swaggerUi.setup());
    this._logger.info(`added swagger at ${swaggerPath}`);
  }

  async generateSwagger() {
    this._logger.log('debug', 'start init swaggger document');
    // retry loading missing services until every public service is loaded
    while (!this._dynamicSwaggerCreator.isReadAll()) {
      await this._partialLoadSwagger();
    }
    this._logger.log('info', 'all servers are up and running ');
    return Promise.resolve();
  }

  async _partialLoadSwagger() {
    let successServicesSize, swaggerJson;
    // keep trying to load new missing services until at least one loads successfully
    do {
      try {
        successServicesSize = this._dynamicSwaggerCreator.getSuccessServicesSize();
        swaggerJson = null;
        // try loading missing services
        swaggerJson = await this._dynamicSwaggerCreator.createDynamicSwagger();
        // wait for a while before retrying if error occurred and no new services ware loaded
        if (!swaggerJson && successServicesSize === this._dynamicSwaggerCreator.getSuccessServicesSize()) {
          await this._helper.sleep(this._dynamicSwaggerDelayInSec * 1000);
        }
      } catch (e) {
        this._logger.log('error', `Error initSwagggerServer: ${e.message || e}`);
      }
    } while (successServicesSize === this._dynamicSwaggerCreator.getSuccessServicesSize());
    // add newly loaded services to served swagger
    this._swaggerDoc = swaggerJson;
    this._logger.log('info', 'Done partial init swaggger server');
    return Promise.resolve();
  }
};
