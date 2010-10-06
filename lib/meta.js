var Meta, Utils, querystring;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __hasProp = Object.prototype.hasOwnProperty;
Utils = require('./utils');
querystring = require('querystring');
Meta = function(bucket, key, options) {
  var _ref, meta;
  if (arguments.length === 1 && bucket instanceof Object) {
    options = bucket;
    _ref = [options.bucket, options.key];
    bucket = _ref[0];
    key = _ref[1];
  }
  meta = (function() {
    if (options instanceof Meta) {
      return options;
    } else {
      this.load(options);
      return this;
    }
  }).call(this);
  _ref = [bucket, key];
  meta.bucket = _ref[0];
  meta.key = _ref[1];
  return meta;
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
Meta.prototype.load = function(options, additionalProperties, additionalDefaults) {
  var defaults, props;
  defaults = Utils.mixin(true, {}, Meta.defaults, additionalDefaults);
  if ((typeof options === "undefined" || options === null) ? undefined : options.links) {
    if (!(Array.isArray(options.links))) {
      options.links = [options.links];
    }
  }
  this.usermeta = Utils.mixin(true, {}, defaults, this, options);
  props = Utils.uniq(Meta.riakProperties.concat(additionalProperties).concat(Object.keys(defaults)));
  return props.forEach(__bind(function(key) {
    var _ref, value;
    value = (typeof (_ref = this.popKey(key)) !== "undefined" && _ref !== null) ? _ref : Meta.defaults[key];
    return (typeof value !== "undefined" && value !== null) ? (this[key] = value) : delete this[key];
  }, this));
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
      return "text/" + (type);
    case 'jpeg':
    case 'gif':
    case 'png':
      return "image/" + (type);
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
Meta.prototype.addLink = function(link) {
  return this.links.push(link);
};
Meta.prototype.removeLink = function(link) {
  return (this.links = this.links.filter(function(l) {
    return l === link;
  }));
};
Meta.riakProperties = ['bucket', 'key', 'contentType', 'vclock', 'lastMod', 'lastModUsecs', 'charset', 'contentEncoding', 'r', 'w', 'dw', 'rw', 'links', 'etag', 'raw', 'clientId', 'returnbody', 'vtag'];
Meta.defaults = {
  links: [],
  contentType: 'json',
  raw: 'riak',
  clientId: 'riak-js',
  debug: true,
  data: undefined
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