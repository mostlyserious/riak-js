exports.getClient = function(options) {
  var r = require('./riak-node')
  return new r.Client(options)
}