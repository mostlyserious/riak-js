var Meta = require('./meta'),
  util = require('util');

var ProtocolBuffersSearchMeta = function ProtocolBuffersSearchMeta(options) {
  var args = Array.prototype.slice.call(arguments);
  Meta.apply(this, args);
}

util.inherits(ProtocolBuffersSearchMeta, Meta);

ProtocolBuffersSearchMeta.prototype.loadResponse = function(response) {
  if (response.docs !== undefined) {
    response.docs = response.docs.map(function(doc) {
      var mappedDoc = {};
      doc.fields.forEach(function(field) {
        mappedDoc[field.key]  = field.value;
      });
      return {fields: mappedDoc};
    })
  }
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
