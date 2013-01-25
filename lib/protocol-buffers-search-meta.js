var Meta = require('./meta'),
  util = require('util');

var ProtocolBuffersSearchMeta = function ProtocolBuffersSearchMeta(options) {
  var args = Array.prototype.slice.call(arguments);
  Meta.apply(this, args);
}

util.inherits(ProtocolBuffersSearchMeta, Meta);

ProtocolBuffersSearchMeta.prototype.loadResponse = function(response) {
  console.log(response);
}

ProtocolBuffersSearchMeta.prototype.requestParameters = function() {
  var parameters = {};

  ProtocolBuffersSearchMeta.queryProperties.forEach(function(property) {
    if (this[property] !== undefined) parameters[property] = this[property];
  }.bind(this));

  return parameters;
}

ProtocolBuffersSearchMeta.queryProperties = [
  'q',
  'start',
  'rows',
  'wt',
  'sort',
  'presort',
  'filter',
  'fl',
  'op',
  'index'
]

module.exports = ProtocolBuffersSearchMeta;
