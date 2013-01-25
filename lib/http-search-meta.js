var HttpMeta = require('./http-meta'),
    Meta = require('./meta'),
    util = require('util'),
    utils = require('./utils'),
    querystring = require('querystring'),

HttpSearchMeta = function() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift(HttpMeta.defaults);
  Meta.apply(this, args);
}

util.inherits(HttpSearchMeta, HttpMeta);

Object.defineProperty(HttpSearchMeta.prototype, 'headers', {
  get: function() {
    var headers = {};
    
    Object.keys(requestMappings).forEach(function(key) {
      if (this[key]) {
        var value = requestMappings[key];
        headers[value] = this[key];
      }
    }.bind(this));
    
    this._headers = utils.mixin(headers, this._headers);
    
    if (this.data) {
      if (this.data.length) this._headers['Content-Length'] = String(this.data.length);
    }
    
    return this._headers;
  },
  
  set: function(headers) {
    this._headers = headers;
    this._cacheHeaders = false; // invalidate header cache

    Object.keys(responseMappings).forEach(function(key) {
      var value = responseMappings[key];
      this[value] = headers[key];
    }.bind(this));
  },
  
  enumerable: true
});

Object.defineProperty(HttpSearchMeta.prototype, 'path', {
  get: function() {
    var queryParameters = {};
    HttpSearchMeta.queryProperties.forEach(function(p) {
      if (this[p] !== undefined) queryParameters[p] = this[p];
    }.bind(this));

    var queryString = querystring.stringify(queryParameters),
      operation = "/" + this.operation,
      index = "/" + this.index,
      qs = queryString ? "?" + queryString : '';

    return "/" + this.resource + index + operation + qs;
  },
  enumerable: true
  
});


var requestMappings = {
  'contentType': 'Content-Type', // TODO temporarily here, because it needs to be set when automagically detecting content type
  'contentLength': 'Content-Length',
  'accept': 'Accept',
  'host': 'Host',
} 

var responseMappings = {
  'content-type': 'contentType', // binary depends on the contentType
  'content-length': 'contentLength',
  'transfer-encoding': 'transferEncoding',
  'x-riak-vclock': 'vclock',
  'last-modified': 'lastMod',
  'content-range': 'contentRange',
  'accept-ranges': 'acceptRanges',
  'date': 'date'
}

HttpSearchMeta.queryProperties = [
  'q',
  'start',
  'rows',
  'wt',
  'sort',
  'presort',
  'filter',
  'fl'
];

module.exports = HttpSearchMeta;
