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
  
  this.headers = response.headers;
  
  this.statusCode = response.statusCode;

  //   # usermeta
  //   for k,v of headers
  //     u = k.match /^X-Riak-Meta-(.*)/i
  //     @usermeta[u[1]] = v if u
  //   
  //   # links
  //   if headers.link then @links = linkUtils.stringToLinks headers.link
  //   
  //   # etag -- replace any quotes in the string
  //   if headers.etag then @etag = headers.etag.replace /"/g, ''
  // 
    
  // location
  if (this.headers.location) {
    var match = this.headers.location.match(/^\/([^\/]+)(?:\/([^\/]+))?\/([^\/]+)$/);
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
    // headers['Link'] = linkUtils.linksToString(@links, @raw) if @links.length > 0
    
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

HttpMeta.prototype.__defineGetter__('path', function() {

  var queryString = stringifyQuery(queryProps(this)),
    bq = this.bucket ? "/" + doEncodeUri(this.bucket, this.encodeUri) : '',
    kq = this.key ? "/" + doEncodeUri(this.key, this.encodeUri) : '';
    qs = queryString ? "?" + queryString : '';
  
  return "/" + this.resource + bq + kq + qs;
  
});

// TODO check this, maybe it should be private
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
  // search
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

var queryProps = function(self) {
  var qp = {};
  HttpMeta.queryProperties.forEach(function(p) {
    if (self[p] !== undefined) qp[p] = self[p]
  });
  return qp;
}

var stringifyQuery = querystring.stringify;

// stringifyQuery: (query) ->
//   for key, value of query
//     query[key] = String(value) if typeof value is 'boolean' # stringify booleans
//   querystring.stringify(query)

var doEncodeUri = function(component, encodeUri) {
  component = component || '';
  if (!encodeUri) return component;
  return encodeURIComponent(component.replace(/\+/g, "%20"));
}

var requestMappings = {
  'contentType': 'Content-Type', // TODO temporarily here, because it needs to be set when automagically detecting content type
  'contentLength': 'Content-Length',
  'accept': 'Accept',
  'host': 'Host',
  'clientId': 'X-Riak-ClientId',
  'vclock': 'X-Riak-Vclock'
  // lastMod: 'If-Modified-Since' # check possible bug with these
  // etag: 'If-None-Match' # check possible bug with these

  // other request info:
  // usermeta (X-Riak-Meta-*), links, contentType (when a body is supplied)
  // ignored info: binary, resource, url, path
}

var responseMappings = {
  'content-type': 'contentType', // binary depends on the contentType
  'content-length': 'contentLength',
  'x-riak-vclock': 'vclock',
  'last-modified': 'lastMod',
  'content-range': 'contentRange',
  'accept-ranges': 'acceptRanges',
}