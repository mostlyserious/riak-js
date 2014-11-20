var Meta = require('./meta'),
  util = require('util');

var ProtocolBuffersMeta = function ProtocolBuffersMeta(options) {
  var args = Array.prototype.slice.call(arguments);
  Meta.apply(this, args);
}

util.inherits(ProtocolBuffersMeta, Meta);

ProtocolBuffersMeta.prototype.loadResponse = function(response) {
  if(response.key !== undefined) this.key = response.key;

  if (response.content !== undefined) {
    var content = response.content[0];
    this.contentType = content.content_type;
    this.lastMod = content.last_mod
    this.vclock = response.vclock.toString();
  }
}

ProtocolBuffersMeta.prototype.parse = function(data) {
  // normalize falsey values to undefined
  if (!data) return undefined;

  switch (this.contentType) {
    case 'application/json': return data;
    case 'text/plain': return data.toString();
    default: return data;
  }

}

ProtocolBuffersMeta.prototype.requestParameters = function() {
  var parameters = {
    bucket: this.bucket,
    key: this.key,
    q: this.q,
    index: this.index
  };

  Object.keys(parameters).forEach(function(name) {
    if(!parameters[name]) {
      delete parameters[name];
    }
  });

  if (this.data !== undefined) {
    parameters.content = {
      value: this.data.toString(),
      content_type: this.contentType
    };

    if(!parameters.content.content_type) {
      delete parameters.content.content_type;
    }
  }

  if (this.props !== undefined) {
    parameters.props = this.props;
  }

  return parameters;
}

module.exports = ProtocolBuffersMeta;
