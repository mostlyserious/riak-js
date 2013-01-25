var ProtocolBuffersSearchMeta = require('./protocol-buffers-search-meta.js');

var ProtocolBuffersSearchClient = function ProtocolBuffersSearchClient(options, callback) {
  this.options = options;
  this._execute = callback;
}

ProtocolBuffersSearchClient.prototype.find = function(index, query, options, callback) {
  var meta = new ProtocolBuffersSearchMeta(options, {q: query, index: index, callback: callback});
  this._execute('search', meta);
}

module.exports = ProtocolBuffersSearchClient;
