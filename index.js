exports.getClient = function(options) {
  var r = require('./lib/riak-node')
  return new r.Client(options)
}