var Meta = require('./meta'),
  utils = require('./utils'),
  util = require('util'),
  querystring = require('querystring');

var HttpMeta = function(options) {
  options = utils.mixin(HttpMeta.defaults, options);
  Meta.call(this, options);
}

util.inherits(HttpMeta, Meta);

HttpMeta.prototype.loadResponse = function(response) {
  
  var headers = this.headers = response.headers; // this.headers (using the setter)
  
  this.statusCode = response.statusCode;

  // links
  this.links = linkUtils.stringToLinks(headers.link);

  // etag -- replace any quotes in the string
  if (headers.etag) this.etag = headers.etag.replace(/"/g, '');
    
  // location
  if (this._headers.location) {
    var match = this._headers.location.match(/^\/([^\/]+)(?:\/([^\/]+))?\/([^\/]+)$/);
    if (match) {
      this.resource = match[1];
      this.bucket = match[2];
      this.key = match[3];
    }    
  }
  
  delete this.method;
  
  return this;
  
}

Object.defineProperty(HttpMeta.prototype, 'headers', {
  
  get: function() {

    // attempt to return a cached version
    if (this._cacheHeaders) return this._headers;

    var headers = {};
    
    Object.keys(requestMappings).forEach(function(key) {
      if (this[key]) {
        var value = requestMappings[key];
        headers[value] = this[key];
      }
    }.bind(this));
    
    this._headers = utils.mixin(headers, this._headers);
    
    // remove client id if there's no vclock
    if (!this.vclock) delete this._headers[requestMappings.clientId];
    
    // 2i
    if (typeof this.index === 'object') {
      Object.keys(this.index).forEach(function(key) {
        var value = this.index[key],
          type = typeof value === 'number' ? 'int' : 'bin';
        this._headers['X-Riak-index-' + key + '_' + type] = value;
      }.bind(this));      
    }
    
    // links
    if (this.links.length > 0) {
      this._headers['Link'] = linkUtils.linksToString(this.links, this.resource);
    }
    
    if (this.data) {
      if (this.data.length) this._headers['Content-Length'] = String(this.data.length);
    }
    
    this._cacheHeaders = true; // headers cached
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

Object.defineProperty(HttpMeta.prototype, 'path', {
  
  get: function() {
    var qp = {};
    HttpMeta.queryProperties.forEach(function(p) {
      if (this[p] !== undefined) qp[p] = this[p];
    }.bind(this));

    var queryString = querystring.stringify(qp),
      bq = this.bucket ? "/" + _encodeUri(this.bucket, this.encodeUri) : '',
      kq = this.key ? "/" + _encodeUri(this.key, this.encodeUri) : '';
      qs = queryString ? "?" + queryString : '';

    return "/" + this.resource + bq + kq + qs;
  },
  
  enumerable: true
  
});

HttpMeta.defaults = {
  // none at the moment
}

HttpMeta.queryProperties = [
  'r',
  'w',
  'dw',
  'rw',
  'keys',
  'props',
  'vtag',
  'returnbody',
  'chunked',
  'buckets',
  'q',
  'start',
  'rows',
  'wt',
  'sort',
  'presort',
  'filter',
  'fl'
]

HttpMeta.riakProperties = ['statusCode', 'host', 'noError404', 'index']

module.exports = HttpMeta;


/****************************/


// private

var _encodeUri = function(component, encodeUri) {
  component = component || '';
  if (!encodeUri) return component;
  return encodeURIComponent(component.replace(/\+/g, "%20"));
}

var linkUtils = {
  
  stringToLinks: function(links) {
    if (!links) return [];
    
    return links
      .split(',')
      .map(function(link) {
        var captures = link.trim().match(/^<\/([^\/]+)\/([^\/]+)\/([^\/]+)>;\sriaktag="(.+)"$/);
        if (captures) {
          captures = captures.map(function(c) { return decodeURIComponent(c) });
          return { bucket: captures[2], key: captures[3], tag: captures[4] };
        }
      })
      .filter(function(e) { !!e });
  },
  
  linksToString: function(links, resource) {
    return links
      .map(function(link) {
        return "</" + resource + "/" + encodeURIComponent(link.bucket) + "/" + encodeURIComponent(link.key) + '>; riaktag="' + (encodeURIComponent(link.tag) || "_") + '"';
      })
      .join(', ');
  }
  
}

// mappings

var requestMappings = {
  'contentType': 'Content-Type', // TODO temporarily here, because it needs to be set when automagically detecting content type
  'contentLength': 'Content-Length',
  'accept': 'Accept',
  'host': 'Host',
  'clientId': 'X-Riak-ClientId',
  'vclock': 'X-Riak-Vclock'
  // lastMod: 'If-Modified-Since' # check possible bug with these
  // etag: 'If-None-Match' # check possible bug with these
}

var responseMappings = {
  'content-type': 'contentType', // binary depends on the contentType
  'content-length': 'contentLength',
  'transfer-encoding': 'transferEncoding',
  'x-riak-vclock': 'vclock',
  'last-modified': 'lastMod',
  'content-range': 'contentRange',
  'accept-ranges': 'acceptRanges'
}