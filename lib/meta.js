(function() {
  var Meta;
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
  Meta = function(bucket, key, options) {
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
    return (dec = Meta.encoders[this.contentType]) ? dec(value) : value.toString();
  };
  Meta.prototype.load = function(options) {
    this.usermeta = options || {};
    return Meta.riakProperties.forEach(__bind(function(key) {
      var value;
      value = this.popKey(key) || Meta.riakPropertyDefaults[key];
      return value ? (this[key] = value) : delete this[key];
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
  Meta.riakProperties = ['contentType', 'vclock', 'lastMod', 'lastModUsecs', 'vtag', 'charset', 'contentEncoding', 'statusCode', 'links', 'etag', 'r', 'w', 'dw', 'returnBody', 'rw'];
  Meta.riakPropertyDefaults = {
    links: [],
    contentType: 'json'
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
    this._type.match(/octet/) || this._type.match(/^image/) ? (this.binary = true) : (this.binary = false);
    return this._type;
  });
  module.exports = Meta;
})();
