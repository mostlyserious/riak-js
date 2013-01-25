var ProtocolBuffersMeta = require('./protocol-buffers-meta.js');

var ProtocolBuffersSearchClient = function ProtocolBuffersSearchClient(options, callback) {
  this.options = options;
  this._execute = callback;
}

ProtocolBuffersSearchClient.prototype.find = function(index, query, options, callback) {
  var meta = new ProtocolBuffersMeta(options, {q: query, index: index, callback: callback});
  this._execute('search', meta);
}

module.exports = ProtocolBuffersSearchClient;
