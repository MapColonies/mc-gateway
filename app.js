'use strict';

let SwaggerUi = require('swagger-tools/middleware/swagger-ui');
let SwaggerExpress = require('swagger-express-mw');
let express = require('express');
let app = express();
let http = require('http');
let httpProxy = require('http-proxy');
let container = require('./containerConfig');
let config = require('config');
let swaggerConfig = config.get('swagger');
let dns = require('dns-socket');
let dnsSocket = dns();
let serviceName = require('./package.json').name;
let url = require('url');
let request = require('request');
let dynamicSwaggerDelayInSec = config.get('dynamicSwaggerDelayInSec');
let logger = container.get('logger');
let probe = container.get('probe');
let userAuthenticator = container.get('userAuthenticator');
let dynamicSwaggerCreator = container.get('dynamicSwaggerCreator');
let helper = container.get('helper');
let JsonRefs = require('json-refs');
const serviceInst = swaggerConfig.serviceInst;

module.exports = app;

//override console error because package swagger-node-runner using it
console.error = (msg) => {
    let logLevel = 'error';
    let msgObj;
    try {
        msgObj = JSON.parse(msg);
    } catch (e) {
    }
    if (Array.isArray(msgObj)) {
        let errorFlag = false;
        for (let m of msgObj) {
            if ((m.code !== "EXTRA_REFERENCE_PROPERTIES") || (!m.message.includes("ignore"))) {
                errorFlag = true;
                break;
            }
        }
        if (!errorFlag) {
            logLevel = 'debug';
        }

    }
    if (logLevel === 'error') {
        logger.log('error', msg);
    } else {
        logger.log('debug', msg);
    }
};

const errorOps = (err) => {
    logger.log('error', `Error ${err.message || err}`);
    probe.readyFlag = false;
    probe.liveFlag = false;
    probe.addError(err);
};

// Start the probe server
probe.start(app, swaggerConfig.swPort).catch(err => {
    logger.log('error', `Cannot start server ${err}`);
});

async function startSwagggerServer() {
    logger.log('debug', `start swaggger server`);

    let swaggerExpressConfig = {
        appRoot: __dirname,
        debug: false
    };

    return new Promise((resolve, reject) => {
        JsonRefs.clearCache();
        probe.stop();
        app = express();
        SwaggerExpress.create(swaggerExpressConfig, function (err, swaggerExpress) {
            if (err) {
                throw err;
            }

            swaggerExpress.runner.swagger.host = swaggerConfig.swDomain + serviceInst + (swaggerConfig.namespace ? ("-" + swaggerConfig.namespace) : "");

            app.use(SwaggerUi(swaggerExpress.runner.swagger, {
                apiDocs: "/api-gw" + (swaggerConfig.namespace ? ("-" + swaggerConfig.namespace) : "") + serviceInst + "-internal/api-docs",
                swaggerUi: '/docs'
            }, {}));

            app.use(express.static('./docs'));

            // install middleware
            swaggerExpress.register(app);


            // Start the server

            probe.start(app, swaggerConfig.swPort).then(() => {
                logger.log('info', "service started at http://localhost:" + config.get('server').port);
                logger.log('info', `swagger started at http://localhost:${swaggerConfig.swPort}/docs`);
                resolve();
            }).catch(err => {
                logger.log('error', `Cannot start server ${err}`);
                reject(new Error(`Cannot start proxy server on port ${swaggerConfig.swPort}`))

            });

        });
    });
}

async function initSwagggerServer(partialapi = true) {
    logger.log('debug', `start init swaggger server partialapi: ${partialapi}`);
    let successServicesSize;
    do {
        do {
            try {
                successServicesSize = dynamicSwaggerCreator.getSuccessServicesSize();
                let isError = await dynamicSwaggerCreator.createDynamicSwagger();
                if (isError) {
                    if (successServicesSize === dynamicSwaggerCreator.getSuccessServicesSize()) {
                        if (!partialapi || dynamicSwaggerCreator.getSuccessServicesSize() === 0) {
                            await helper.sleep(dynamicSwaggerDelayInSec * 1000);
                        }
                    }
                }
            } catch (e) {
                logger.log('error', `Error initSwagggerServer: ${e.message || e}`);
            }
        } while (successServicesSize === dynamicSwaggerCreator.getSuccessServicesSize());
        try {
            await startSwagggerServer();
        } catch (e) {
            logger.log('error', `error start swaggger server ${e.message || e}`);
        }
    } while (!partialapi && !dynamicSwaggerCreator.isReadAll()) ;
    if (!partialapi) {
        logger.log('info', "Done init swaggger server");
    }
    return Promise.resolve();

}

async function initProxyServer() {
    //initiate proxy server
    let proxy = httpProxy.createProxy();
    proxy.on('error', (err, req, res) => {
        res.statusCode = 500;
        res.end(`Adress ${req.url} not found error : ${err.message}`);
    });
    let routingDiscover = container.get('routingDiscover');


    let proxyServer = http.createServer(async (req, res) => {
        try {
            logger.log('debug', "got request from host:" + (req.connection.remoteAddress || req.socket.remoteAddress));
            //var pathname = url.parse(req.url, false, true).pathname;
            // if (pathname === "/readme.md" || pathname === "/changelog.md")
            //     return;

            if (req.method === "OPTIONS" || userAuthenticator.checkUser(req)) {
                let rout = await routingDiscover.getRout(req.url);
                proxy.web(req, res, {target: rout});
            } else {
                res.statusCode = 403;
                res.end("User name is required");
            }

        } catch (err) {
            res.statusCode = 500;
            res.end(err.message);
            logger.log('warn', `Cannot resolve host url = ${req.url} warn msg: ${err.message}`);
        }
    });
    return new Promise((resolve, reject) => {
        proxyServer.listen(config.get('proxy').port, () => {
            logger.log('info', "proxy started at http://localhost:" + config.get('proxy').port);
            resolve();
        }).on('error', (err) => {
            errorOps(err);
            reject(new Error(`Cannot start proxy server on port ${config.get('proxy').port}`))
        })
    });

}

//init must done without errors in order to be readiness
(async () => {
    try {
        await initSwagggerServer(true);
        await initProxyServer();
        probe.readyFlag = true;
        if (!dynamicSwaggerCreator.isReadAll()) {
            initSwagggerServer(false);
        } else {
            logger.log('info', 'all servers are up and running ');
        }
    } catch (err) {
        errorOps(err);
    }
})();









