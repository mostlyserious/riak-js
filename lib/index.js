/**
 * Get a riak-js client
 *
 * @param {Object} Initial options, that will apply for the whole session
 * @return {Riak} The riak-js client
 * @api public
 */
exports.getClient = function(options) {
  var Riak = require('./riak-node')
  return new Riak(options)
}