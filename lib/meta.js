var Meta, Utils, querystring;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __hasProp = Object.prototype.hasOwnProperty;
Utils = require('./utils');
querystring = require('querystring');
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
  Meta.riakProperties.forEach(__bind(function(key) {
    var value;
    value = this.popKey(key);
    if (value === undefined) {
      value = Meta.defaults[key];
    }
    if (value !== undefined) {
      if (key === 'links' && !Array.isArray(value)) {
        value = [value];
      }
      return (this[key] = value);
    } else {
      return delete this[key];
    }
  }, this));
  this.url = ("/" + (this.raw) + "/" + (this.bucket) + "/" + (this.key || ''));
  this.queryProps = {};
  Meta.queryProperties.forEach(__bind(function(prop) {
    if (this[prop] !== undefined) {
      return (this.queryProps[prop] = this[prop]);
    }
  }, this));
  this.queryString = this.stringifyQuery(this.queryProps);
  return (this.path = ("" + (this.url) + (this.queryString ? '?' + this.queryString : '')));
};
Meta.prototype.encodeData = function() {
  return this.encode(this.data);
};
Meta.prototype.guessType = function(type) {
  switch (type) {
    case 'json':
      return 'application/json';
    case 'xml':
    case 'plain':
      return "text/" + type;
    case 'jpeg':
    case 'gif':
    case 'png':
      return "image/" + type;
    case 'binary':
      return 'application/octet-stream';
    default:
      return type;
  }
};
Meta.prototype.popKey = function(key) {
  var value;
  value = this.usermeta[key];
  delete this.usermeta[key];
  return value;
};
Meta.prototype.stringifyQuery = function(query) {
  var _ref, key, value;
  _ref = query;
  for (key in _ref) {
    if (!__hasProp.call(_ref, key)) continue;
    value = _ref[key];
    if (typeof value === 'boolean') {
      query[key] = String(value);
    }
  }
  return querystring.stringify(query);
};
Meta.queryProperties = ['r', 'w', 'dw', 'rw', 'keys', 'props', 'vtag', 'nocache', 'returnbody', 'chunked'];
Meta.riakProperties = ['contentType', 'vclock', 'lastMod', 'lastModUsecs', 'charset', 'contentEncoding', 'statusCode', 'links', 'etag', 'raw', 'nocache', 'clientId', 'data', 'host'].concat(Meta.queryProperties);
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