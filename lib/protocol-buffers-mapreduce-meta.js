var Meta = require('./meta'),
  util = require('util');

var ProtocolBuffersMapReduceMeta = function ProtocolBuffersMapReduceMeta(options) {
  var args = Array.prototype.slice.call(arguments);
  Meta.apply(this, args);
}

util.inherits(ProtocolBuffersMapReduceMeta, Meta);

ProtocolBuffersMapReduceMeta.prototype.loadResponse = function(response) {
}

ProtocolBuffersMapReduceMeta.prototype.requestParameters = function() {
  return {request: this.data.toString(), content_type: "application/json"};
}

ProtocolBuffersMapReduceMeta.queryProperties = [
  "query",
  "inputs"
]

module.exports = ProtocolBuffersMapReduceMeta;
