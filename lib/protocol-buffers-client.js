var Client = require('./client'),
  ProtocolBuffersMeta = require('./protocol-buffers-meta.js'),
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
  var meta = new ProtocolBuffersMeta(options, { bucket: bucket, key: key, callback: callback });
  this._execute('get', meta);
}

ProtocolBuffersClient.prototype.save = function(bucket, key, data, options, callback) {
  var meta = new ProtocolBuffersMeta(options, { bucket: bucket, key: key, callback: callback});
  meta.loadData(data);
  this._execute('put', meta);
}

ProtocolBuffersClient.prototype._execute = function(operation, meta) {
  this._connection[operation](meta.requestParameters(), function(response) {
    meta.loadResponse(response);
    var data, error;
    if (response.content !== undefined) {
      data = meta.parse(response.content[0].value);
    }
    meta.callback(error, data, meta);
  });
}

ProtocolBuffersClient.prototype.end = function() {
  this._connection.disconnect();
}

module.exports = ProtocolBuffersClient;
