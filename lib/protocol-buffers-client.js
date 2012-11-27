var Client = require('./client'),
  protobuf = require('protobuf.js'),
  riakpbc = require('riakpbc'),
  util = require('util');

var ProtocolBuffersClient = function ProtocolBuffersClient(options) {
  Client.call(this, options);
  this._defaults = options || {};
  this._connection = riakpbc.createClient(options);
}

util.inherits(ProtocolBuffersClient, Client);

ProtocolBuffersClient.prototype.get = function(bucket, key, options, callback) {
  var meta = { bucket: bucket, key: key };
  this._connection.get(meta, callback);
}

module.exports = ProtocolBuffersClient;
