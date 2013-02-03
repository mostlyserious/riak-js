var Mapper = require('./mapper'),
    ProtocolBuffersMapReduceMeta = require('./protocol-buffers-mapreduce-meta');

var ProtocolBuffersMapReduceClient = function ProtocolBuffersMapReduceClient(defaults, callback) {
  this._execute = callback;
  this._defaults = defaults;
}

ProtocolBuffersMapReduceClient.prototype.add = function(inputs) {
  return new Mapper(inputs, this);
}

ProtocolBuffersMapReduceClient.prototype._run = function(job, options, callback) {
  var meta = new ProtocolBuffersMapReduceMeta(this._defaults, options, {callback: callback});
  meta.loadData(job.data);
  this._execute('mapred', meta);
}

module.exports = ProtocolBuffersMapReduceClient;
