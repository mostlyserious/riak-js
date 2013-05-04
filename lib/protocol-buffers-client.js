var Client = require('./client'),
  ProtocolBuffersMeta = require('./protocol-buffers-meta.js'),
  ProtocolBuffersSearchClient = require('./protocol-buffers-search-client.js'),
  ProtocolBuffersMapReduceClient = require('./protocol-buffers-mapreduce-client.js'),
  protobuf = require('protobuf.js'),
  riakpbc = require('riakpbc'),
  util = require('util');

var ProtocolBuffersClient = function ProtocolBuffersClient(options) {
  Client.call(this, options);
  this._defaults = options || {};
  this._connection = riakpbc.createClient(options);
  var execute = function(operation, meta) {
    return this._execute(operation, meta);
  }.bind(this);
  this.search = new ProtocolBuffersSearchClient(this._defaults, execute);
  this.mapreduce = new ProtocolBuffersMapReduceClient(this._defaults, execute);
}

var expectedResponseOperations = ['get', 'getBucket', 'getBuckets', 'getKeys'];

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

ProtocolBuffersClient.prototype.getBucket = function(bucket, options, callback) {
  var meta = new ProtocolBuffersMeta(options, {bucket: bucket, callback: callback});
  callback = meta.callback;
  var _callback = function(err, data, _meta) {
    callback(err, data.props, _meta);
  }
  meta.callback = _callback;
  this._execute('getBucket', meta);
}

ProtocolBuffersClient.prototype.saveBucket = function(bucket, properties, options, callback) {
  var meta = new ProtocolBuffersMeta(options, {bucket: bucket, props: properties, callback: callback});
  this._execute('setBucket', meta);
}

ProtocolBuffersClient.prototype.keys = function(bucket, options, callback) {
  var meta = new ProtocolBuffersMeta(options, {bucket: bucket, callback: callback});
  if (meta.keys == 'stream') {
    meta.chunked = true;
    var emitter = this._execute('getKeys', meta);
    emitter.on('data', function(data) {
      emitter.emit('keys', data['keys']);
    })
    emitter.start = function() {};
    return emitter;
  } else {
    this._execute('getKeys', meta);
  }
}

ProtocolBuffersClient.prototype.ping = function(options, callback) {
  var meta = new ProtocolBuffersMeta(options, {callback: callback});
  this._execute('ping', meta, false);
}

ProtocolBuffersClient.prototype._execute = function(operation, meta, includeParameters) {
  var callback = function(response) {
    meta.loadResponse(response);
    var data = response, error = null;

    if (response.content !== undefined) {
      data = meta.parse(response.content[0].value);
    }

    if (Object.keys(response).length == 0 && expectedResponseOperations.indexOf(operation) > -1) {
      error = {notFound: true};
    }

    if (response.errmsg !== undefined) {
      error = {
        message: response.errmsg,
        statusCode: response.errcode
      }
    }
    meta.callback(error, data, meta);
  }

  if (includeParameters === false) {
    return this._connection[operation](callback);
  } else if (meta.chunked) {
    return this._connection[operation](meta.requestParameters(), true, callback);
  } else {
    return this._connection[operation](meta.requestParameters(), callback);
  }
}

ProtocolBuffersClient.prototype.end = function() {
  this._connection.disconnect();
}

module.exports = ProtocolBuffersClient;
