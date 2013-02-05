/**
 * Module dependencies.
 */
var Meta = require('./meta'),
  utils = require('./utils'),
  util = require('util'),
  querystring = require('querystring');

/**
 * Initialize a `Meta` for the HTTP implementation.
 *
 * @api private
 */
var HttpMeta = function() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift(HttpMeta.defaults);
  Meta.apply(this, args);
}

util.inherits(HttpMeta, Meta);

/**
 * Loads an `http.ServerResponse` object into the current `Meta`, mutating several of its properties.
 *
 * @param {ServerResponse} response
 * @api private
 */
HttpMeta.prototype.loadResponse = function(response) {
  
  var headers = this.headers = response.headers; // this.headers (using the setter)
  
  this.statusCode = response.statusCode;

  // links
  if (headers.link){
    this.links = linkUtils.stringToLinks(headers.link);
  } else if (response.client !== undefined && response.client._httpMessage._headers.link) {
    this.links = linkUtils.stringToLinks(response.client._httpMessage._headers.link);
  }

  // etag -- replace any quotes in the string
  if (headers.etag) this.etag = headers.etag.replace(/"/g, '');
    
  // location
  if (headers.location) {
    var match = headers.location.match(/^\/([^\/]+)(?:\/([^\/]+))?\/([^\/]+)$/);
    if (match) {
      this.resource = match[1];
      this.bucket = match[2];
      this.key = match[3];
    }    
  }
  
  // extract boundary if response is chunked
  if (this.contentType && this.contentType.match(/multipart\/mixed/)) this.boundary = getMultipartBoundary(this.contentType);
  
  delete this.method;
  
}

/**
 * Get/set headers. The getter generates proper headers by mapping `Meta` with `requestMappings`, and overrides those values with headers previously set via the setter. It also caches the computation.
 *
 * @api public
 */
Object.defineProperty(HttpMeta.prototype, 'headers', {
  
  get: function() {

    // attempt to return a cached version
    if (this._cacheHeaders) return this._headers;

    var headers = {},
        length = 0;
    
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
      if (this.data.length) length = String(this.data.length);
    }

    if(!this.contentLength) this._headers['content-length'] = length;
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

/**
 * Path getter. Useful to generate the full URL used to make a request, from properties of the current `Meta`.
 *
 * @return {String} path
 * @api public
 */
Object.defineProperty(HttpMeta.prototype, 'path', {
  
  get: function() {
    var qp = {};
    HttpMeta.queryProperties.forEach(function(p) {
      if (this[p] !== undefined) qp[p] = this[p];
    }.bind(this));

    var queryString = querystring.stringify(qp),
      bq = this.bucket ? "/" + _encodeUri(this.bucket, this.encodeUri) : '',
      kq = this.key ? "/" + _encodeUri(this.key, this.encodeUri) : '',
      qs = queryString ? "?" + queryString : '',
      lw = '';
    if (this.links && this.method == 'get'){
      for (var i = 0, linkLen = this.links.length; i < linkLen; i++){
        var link = this.links[i];
        lw += "/" + [encodeURIComponent(link.bucket || '_'),
                     encodeURIComponent(link.tag || '_'),
                     (link.keep || '_')].join(',');
      }
    }
    return "/" + this.resource + bq + kq + lw + qs;
  },
  
  enumerable: true
  
});

/**
 * Parse multipart content.
 *
 * @param {String} data
 * @param {String} boundary
 * @return {Array} of {Object} with `headers` and `body`
 * @api private
 */
function _parseMultipartMixed(data, boundary){
  var escape = function(s) { return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") };

  boundary = boundary || this.boundary;
  data = data.toString().split(new RegExp("\r?\n--" + escape(boundary) + "--\r?\n"));
  data = (data && data[0]) || "";
    
  var m = new RegExp("\r?\n?--" + escape(boundary) + "\r?\n");
  var b = /boundary=((.)+)/
  return data
    .split(m)
    .filter(function(e) { return !!e })
    .map(function(part) {
      var md = part.split(/\r?\n\r?\n/);
      if (md && md.length > 1) {
        var headers = md[0], body = md[1], _headers = {};
        var subBoundary = headers.match(b);
        if (subBoundary && subBoundary[1] !== boundary){
          md.shift();
          return _parseMultipartMixed(md.join('\r\n\r\n'),subBoundary[1]);
        }
        headers.split(/\r?\n/).forEach(function(header) {
          var s = header.split(': '), k = s[0] && s[0].toLowerCase(), v = s[1];
          if (k && v) _headers[k] = v;
        });
        if (body) return { headers: _headers, body: body };
      }
    })
    .filter(function(e) { return !!e });
}
HttpMeta.prototype._parseMultipartMixed = _parseMultipartMixed;

/**
 * Specific defaults for the HTTP implementation.
 *
 * @api public
 */
HttpMeta.defaults = {
  // none at the moment
}

/**
 * Properties of `Meta` that are considered HTTP query properties (`.path` will tack them after the `?`).
 *
 * @api public
 */
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
  'buckets'
]

module.exports = HttpMeta;


/****************************/


// private

/**
 * Encodes the URI component only if `encodeUri` is truthy.
 *
 * @param {String} component
 * @param {Boolean} encodeUri
 * @return {String} URI-encoded string
 * @api private
 */
var _encodeUri = function(component, encodeUri) {
  component = component || '';
  if (!encodeUri) return component;
  return encodeURIComponent(component.replace(/\+/g, "%20"));
}

var linkUtils = {
  
  /**
   * Parses links coming from a response.
   *
   * @param {String} links
   * @return {Array} of {Object} with links in `Meta` representation.
   * @api private
   */
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
      .filter(function(e) { return !!e });
  },
  
  /**
   * Serializes links.
   *
   * @param {Array} links
   * @param {String} resource - the resource these links live in
   * @return {String} a string ready to ship to Riak
   * @api private
   */
  linksToString: function(links, resource) {
    return links
      .map(function(link) {
        return "</" + resource + "/" + encodeURIComponent(link.bucket) + "/" + encodeURIComponent(link.key) + '>; riaktag="' + (encodeURIComponent(link.tag || "_") || "_") + '"';
      })
      .join(', ');
  }
  
}

/**
 * Extract boundary of multipart message.
 *
 * @param {String} full content type header
 * @return {String} boundary
 * @api private
 */
var getMultipartBoundary = function(contentType) {
  var m = contentType.match(/boundary=([A-Za-z0-9\'()+_,-.\/:=?]+)/);
  return m && m[1];
}

/**
 * Request mappings. Maps one `Meta` property to a Riak-HTTP request value.
 */
var requestMappings = {
  'contentType': 'content-type', // TODO temporarily here, because it needs to be set when automagically detecting content type
  'contentLength': 'content-length',
  'accept': 'accept',
  'host': 'host',
  'clientId': 'x-riak-clientId',
  'vclock': 'x-riak-vclock'
  // lastMod: 'If-Modified-Since' # check possible bug with these
  // etag: 'If-None-Match' # check possible bug with these
}

/**
 * Response mappings. Maps one Riak-HTTP response value to a `Meta` property.
 */
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
