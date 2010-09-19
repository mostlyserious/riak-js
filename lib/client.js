(function() {
  var Client, CoreMeta;
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
  CoreMeta = require('./meta');
  Client = function() {};
  Client.prototype.executeCallback = function(data, meta, callback) {
    callback || (callback = __bind(function(err, data, meta) {
      return this.log(data, {
        json: this.contentType === 'json'
      });
    }, this));
    return callback(data instanceof Error || null, data, meta);
  };
  Client.prototype.log = function(string, options) {
    options || (options = {});
    return string && console && (options.debug !== undefined ? options.debug : CoreMeta.defaults.debug) ? (options.json ? console.dir(string) : console.log(string)) : null;
  };
  module.exports = Client;
})();
