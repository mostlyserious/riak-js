exports.getClient = function(options) {
  options.api || (options.api = exports.defaults.api);
  return exports[options.api](options);
};
exports.http = function(options) {
  return new exports.HttpClient(options);
};
exports.protobuf = function(options) {
  var cli, pool;
  options || (options = {});
  pool = options.pool;
  delete options.pool;
  pool || (pool = new exports.ProtoBufPool(options));
  cli = new exports.ProtoBufClient(options);
  cli.pool = pool;
  return cli;
};
exports.defaults = {
  api: 'http'
};
exports.__defineGetter__('ProtoBufClient', function() {
  return this._pbcClient || (this._pbcClient = require('./protobuf_client'));
});
exports.__defineGetter__('ProtoBufPool', function() {
  return this._pbcPool || (this._pbcPool = require('./protobuf'));
});
exports.__defineGetter__('HttpClient', function() {
  return this._httpClient || (this._httpClient = require('./http_client'));
});