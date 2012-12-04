var Meta = require('./meta'),
  util = require('util');

var ProtocolBuffersMeta = function ProtocolBuffersMeta(options) {
  var args = Array.prototype.slice.call(arguments);
  Meta.apply(this, args);
}

util.inherits(ProtocolBuffersMeta, Meta);

ProtocolBuffersMeta.prototype.loadResponse = function(response) {
  if (response.content !== undefined) {
    var content = response.content[0];
    this.contentType = content.content_type;
    this.lastMod = content.last_mod
    this.vclock = response.vclock.toString();
  }
}

ProtocolBuffersMeta.prototype.requestParameters = function() {
  var parameters = {
    bucket: this.bucket,
    key: this.key,
  };

  if (this.data !== undefined) {
    parameters.content = {
      value: this.data.toString(),
      content_type: this.contentType
    }
  }
  return parameters;
}

module.exports = ProtocolBuffersMeta;
