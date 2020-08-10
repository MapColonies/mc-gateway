const httpProxy = require('http-proxy');

module.exports.ProxyHandler = class ProxyHandler {
  constructor(logger, routingDiscover, userAuthenticator){
    this._logger = logger;
    this._routingDiscover = routingDiscover;
    this._userAuthenticator = userAuthenticator;
  }

  init (app) {
    const proxy = httpProxy.createProxy();
    proxy.on('error', (err, req, res) => {
      res.statusCode = 500;
      res.end(`Address ${req.url} not found error : ${err.message}`);
    });
    this._proxy = proxy;
    app.use('*', this._proxyPass.bind(this));
  };

  async _proxyPass (req, res) {
    try {
      if (req.baseUrl === '/favicon.ico'){
        return res.sendStatus(404);
      }
      this._logger.log('debug', 'got request from host:' + (req.connection.remoteAddress || req.socket.remoteAddress));
      // TODO: add request filtering and replace authenticator
      if (req.method === 'OPTIONS' || this._userAuthenticator.checkUser(req)) {
        // retrieve internal route from discovery service
        const rout = await this._routingDiscover.getRout(req.url);
        // proxy pass the request to internal service
        this._proxy.web(req, res, { target: rout });
      } else {
        res.statusCode = 403;
        res.end('User name is required');
      }
    } catch (err) {
      res.statusCode = 500;
      res.end(err.message);
      this._logger.log('warn', `Cannot resolve host url = ${req.url} warn msg: ${err.message}`);
    }
  };
};
