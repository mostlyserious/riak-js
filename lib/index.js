/**
 * Module dependencies.
 */
var HttpClient = require('./http-client');

module.exports = {
  
  /**
   * Obtains an instance of `HttpClient`.
   *
   * @param {Object|Meta} options [optional]
   * @return {HttpClient}
   * @api public
   */
  getClient: function(options) {
    return new HttpClient(options);
  }
}