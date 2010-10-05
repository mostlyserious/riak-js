var Client, CoreMeta, Utils;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
CoreMeta = require('./meta');
Utils = require('./utils');
Client = function(options) {
  CoreMeta.defaults = Utils.mixin(true, CoreMeta.defaults, options);
  return this;
};
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
  var _ref, callback;
  _ref = options;
  options = _ref[0];
  callback = _ref[1];
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