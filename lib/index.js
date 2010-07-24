exports.getClient = function(options) {
  var Riak = require('./riak-node')
  return new Riak(options)
}