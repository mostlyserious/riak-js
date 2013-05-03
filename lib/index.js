/**
 * Module dependencies.
 */
var HttpClient = require('./http-client'),
    ProtocolBuffersClient = require('./protocol-buffers-client');

module.exports = {
  
  protobuf: function(options) {
    return new ProtocolBuffersClient(options);
  },

  http: function(options) {
    return new HttpClient(options);
  },

  /**
   * Obtains an instance of `HttpClient`.
   *
   * @param {Object|Meta} options [optional]
   * @return {HttpClient}
   * @api public
   */
  getClient: function(options) {
    if (options == undefined) options = {};

    if (options.api == undefined) {
      options.api = 'http';
    }

    return module.exports[options.api](options);
  }
}
