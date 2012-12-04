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
  this._execute('get', meta, callback);
}

ProtocolBuffersClient.prototype.save = function(bucket, key, data, options, callback) {
  var meta = { bucket: bucket, key: key, content: {value: data, content_type: 'text/plain'} };
  this._execute('put', meta, callback);
}

ProtocolBuffersClient.prototype._execute = function(operation, meta, callback) {
  this._connection[operation](meta, callback);
}

ProtocolBuffersClient.prototype.end = function() {
  this._connection.disconnect();
}

module.exports = ProtocolBuffersClient;
