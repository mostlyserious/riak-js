var utils = require('./utils'),
  assert = require('assert');

var Meta = function(options) {
  
  options = utils.mixin(Meta.defaults, options);
  
  // copy properties into this (only those recognized in Meta.keywords)
  // 'data' needs to be treated separately, because the setter relies on other properties being available
  Object.keys(options).filter(function(key) { return key != 'data' }).forEach(function(key) {
    if (~Meta.keywords.indexOf(key)) {
      this[key] = options[key];
    }
  }.bind(this));
  
  // lastly, set data
  this.data = options.data;
  
}

// methods

// Parses a Riak value into a Javascript object, and from
// available information does its best to determine a suitable encoder.
//
//   meta.decode("{\"a\":1}") # => {a: 1}
Meta.prototype.decode = function(data) {
  
  // normalize falsey values to undefined
  if (!data || !data.length) return undefined;
  
  switch (this.contentType) {
    case 'application/json': return JSON.parse(data.toString());
    case 'text/plain': return data.toString();
    default: return data;
  }

}


// Encodes a Javascript object into a Riak value
// 
//   meta.encode({a: 1}) // => "{\"a\":1}"
Meta.prototype.encode = function(data) {
  
  if (this.contentType) {
    // expand if it's in short from, 'html' => 'text/html'
    this.contentType = this._expandType(this.contentType);
  } else {
    
    // if buffer => octet-stream; else try json; else plain text
    
    if (data instanceof Buffer) {
      this.contentType = this._expandType('binary');
    } else if (typeof data === 'object') {
      this.contentType = this._expandType('json');
    } else {
      this.contentType = this._expandType('plain');
    }
    
  }
  
  switch (this.contentType) {
    case 'application/json': return JSON.stringify(data);
    case 'text/plain': return data.toString();
    default: return data;
  }
  
}

Object.defineProperty(Meta.prototype, 'data', {
  
  get: function() {
    return this._data;
  },
  
  set: function(data) {
    if (data) data = this.encode(data);
    this._data = data;
  },
  
  enumerable: true
  
});

// Fills in a full content type based on a few defaults
Meta.prototype._expandType = function(type) {
  switch (type) {
    case 'json': return 'application/json';
    case 'xml':
    case 'html':
    case 'plain': return 'text/' + type;
    case 'jpeg':
    case 'gif':
    case 'png': return 'image/' + type;
    case 'binary': return 'application/octet-stream';
    default: return type;
    
  }
}

// defaults and keywords

Meta.defaults = {
  host: 'localhost',
  port: 8098,
  links: [],
  resource: 'riak',
  clientId: 'riak-js',
  contentEncoding: 'utf8',

  // reserved by riak-js
  debug: false, // print stuff out
  data: undefined, // attach request body data to meta
  encodeUri: false, //don't escape bucket/key URI components
  
  // content-type
  // see @encode -- too complex to have just one simple default
  
}

// Any set properties that aren't in this array are assumed to be custom headers (usermeta)
Meta.keywords = [
  'host',
  'port',
  'bucket',
  'buckets',
  'key',
  'keys',
  'contentType',
  'contentLength',
  'vclock',
  'lastMod',
  'lastModUsecs',
  'charset',
  'chunked',
  'contentEncoding',
  'transferEncoding',
  'props',
  'index',
  'r',
  'w',
  'dw',
  'rw',
  'links',
  'etag',
  'encodeUri',
  'resource',
  'clientId',
  'returnbody',
  'vtag',
  'range',
  'contentRange',
  'acceptRanges',
  'data',
  'stream',
  'headers', // http, we want to keep these so that users can override headers (TODO check)
  '_callback',
  'method' // TODO temp
]

module.exports = Meta;