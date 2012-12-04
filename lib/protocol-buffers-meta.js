var Meta = require('./meta'),
  util = require('util');

var ProtocolBuffersMeta = function ProtocolBuffersMeta(options) {
  Meta.apply(this, options);
}

util.inherits(ProtocolBuffersMeta, Meta);

ProtocolBuffersMeta.prototype.loadResponse = function(response) {
  if (response.content != undefined) {
    var content = response.content[0];
    this.contentType = content.content_type;
    this.lastMod = content.last_mod
  }
}

module.exports = ProtocolBuffersMeta;
