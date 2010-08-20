(function() {
  exports.__defineGetter__('ProtoBufClient', function() {
    return this._pbcClient = this._pbcClient || require('./protobuf_client');
  });
  exports.__defineGetter__('HttpClient', function() {
    return this._pbcClient = this._pbcClient || require('./http_client');
  });
  exports.defaults = {
    api: 'http'
  };
  exports.getClient = function(options) {
    options.api = options.api || exports.defaults.api;
    return exports[options.api](options);
  };
  exports.http = function(options) {
    return new exports.HttpClient(options);
  };
  exports.protobuf = function(options) {
    return new exports.ProtoBufClient(options);
  };
})();
