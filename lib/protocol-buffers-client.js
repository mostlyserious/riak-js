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

ProtocolBuffersClient.prototype.remove = function(bucket, key, options, callback) {
  var meta = new ProtocolBuffersMeta(options, { bucket: bucket, key: key, callback: callback});
  this._execute('del', meta);
}

ProtocolBuffersClient.prototype.buckets = function(options, callback) {
  var meta = new ProtocolBuffersMeta(options, {callback: callback});
  callback = meta.callback;
  var _callback = function(err, data, _meta) {
    callback(err, data.buckets, _meta);
  }
  meta.callback = _callback;
  this._execute('getBuckets', meta, false);
}

ProtocolBuffersClient.prototype._execute = function(operation, meta, includeParameters) {
  var callback = function(response) {
    meta.loadResponse(response);
    var data = response, error = {};

    if (response.content !== undefined) {
      data = meta.parse(response.content[0].value);
    }

    if (Object.keys(response).length == 0) {
      error.notFound = true;
    }
    meta.callback(error, data, meta);
  }

  if (includeParameters === false) {
    this._connection[operation](callback);
  } else {
    this._connection[operation](meta.requestParameters(), callback);
  }
}

ProtocolBuffersClient.prototype.end = function() {
  this._connection.disconnect();
}

module.exports = ProtocolBuffersClient;
