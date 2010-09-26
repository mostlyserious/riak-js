var Meta, Utils;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
Utils = require('./utils');
Meta = function(bucket, key, options, data) {
  this.bucket = bucket;
  this.key = key;
  this.load(options);
  return this;
};
Meta.prototype.decode = function(value) {
  var dec;
  return (dec = Meta.decoders[this.contentType]) ? dec(value) : value;
};
Meta.prototype.encode = function(value) {
  var dec;
  if (value instanceof Buffer) {
    this.contentEncoding = 'binary';
    this.contentType = this.guessType(this.contentEncoding);
    return value;
  }
  return (dec = Meta.encoders[this.contentType]) ? dec(value) : value.toString();
};
Meta.prototype.load = function(options) {
  this.usermeta = Utils.mixin(true, this.defaults, options);
  return Meta.riakProperties.forEach(__bind(function(key) {
    var value;
    value = this.popKey(key) || Meta.defaults[key];
    if (value) {
      if (key === 'links' && !Utils.isArray(value)) {
        value = [value];
      }
      return (this[key] = value);
    } else {
      return delete this[key];
    }
  }, this));
};
Meta.prototype.guessType = function(type) {
  if (type === 'json') {
    return 'application/json';
  } else if (type === 'xml' || type === 'plain') {
    return "text/" + type;
  } else if (type === 'jpeg' || type === 'gif' || type === 'png') {
    return "image/" + type;
  } else if (type === 'binary') {
    return 'application/octet-stream';
  } else {
    return type;
  }
};
Meta.prototype.popKey = function(key) {
  var value;
  value = this.usermeta[key];
  delete this.usermeta[key];
  return value;
};
Meta.riakProperties = ['contentType', 'vclock', 'lastMod', 'lastModUsecs', 'vtag', 'charset', 'contentEncoding', 'statusCode', 'links', 'etag', 'r', 'w', 'dw', 'returnBody', 'rw', 'raw', 'keys', 'nocache', 'clientId', 'data', 'host'];
Meta.defaults = {
  links: [],
  contentType: 'json',
  raw: 'riak',
  clientId: 'riak-js',
  debug: true,
  host: 'localhost'
};
Meta.decoders = {
  "application/json": function(s) {
    return JSON.parse(s);
  }
};
Meta.encoders = {
  "application/json": function(data) {
    return JSON.stringify(data);
  }
};
Meta.prototype.__defineGetter__('contentType', function() {
  return this._type;
});
Meta.prototype.__defineSetter__('contentType', function(type) {
  this._type = this.guessType(type || 'json');
  if (this._type.match(/octet/) || this._type.match(/^image/)) {
    this.binary = true;
  } else {
    this.binary = false;
  }
  return this._type;
});
module.exports = Meta;