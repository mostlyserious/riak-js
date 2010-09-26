var Client, CoreMeta;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
CoreMeta = require('./meta');
Client = function() {};
Client.prototype.executeCallback = function(data, meta, callback) {
  var err;
  callback || (callback = __bind(function(err, data, meta) {
    return this.log(data, {
      json: this.contentType === 'json'
    });
  }, this));
  err = null;
  if (data instanceof Error) {
    err = data;
    data = data.message;
  }
  return callback(err, data, meta);
};
Client.prototype.ensure = function(options) {
  var _a, callback;
  _a = options;
  options = _a[0];
  callback = _a[1];
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  return [options || {}, callback];
};
Client.prototype.log = function(string, options) {
  options || (options = {});
  return string && console && (options.debug !== undefined ? options.debug : CoreMeta.defaults.debug) ? (options.json ? console.dir(string) : console.log(string)) : null;
};
module.exports = Client;