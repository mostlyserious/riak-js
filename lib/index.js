module.exports = {
  http: function(options) {
    return new this.HttpClient(options);
  },
  protobuf: function(options) {
    var cli, pool;
    options || (options = {});
    pool = options.pool;
    delete options.pool;
    pool || (pool = new this.ProtoBufPool(options));
    cli = new this.ProtoBufClient(options);
    cli.pool = pool;
    return cli;
  },
  defaults: {
    api: 'http'
  },
  getClient: function(options) {
    options || (options = {});
    options.api || (options.api = module.exports.defaults.api);
    return this[options.api](options);
  }
};
module.exports.__defineGetter__('ProtoBufClient', function() {
  return this._pbcClient || (this._pbcClient = require('./protobuf_client'));
});
module.exports.__defineGetter__('ProtoBufPool', function() {
  return this._pbcPool || (this._pbcPool = require('./protobuf'));
});
module.exports.__defineGetter__('HttpClient', function() {
  return this._httpClient || (this._httpClient = require('./http_client'));
});