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
    default: return data;
  }

}


// Encodes a Javascript object into a Riak value, and from
// available information does its best to determine three properties:
//
//  - content type
//  - binary (true/false)
//  - instance type (Buffer/String)
// 
//   meta.encode({a: 1}) // => "{\"a\":1}"
Meta.prototype.encode = function(data) {
  
  var json = null;
  
  if (this.contentType) {
    // expand if it's in short from, 'html' => 'text/html'
    this.contentType = this._resolveType(this.contentType);
  } else {
    // if buffer => octet-stream; else try json; else plain text
    if (data instanceof Buffer) {
      this.contentType = this._resolveType('binary');
    } else if (typeof data === 'object') {
      json = JSON.stringify(data);
      this.contentType = this._resolveType('json');
    } else {
      this.contentType = this._resolveType('plain');
    }
    
  }
  
  // binary
  this.binary = this._isBinary(this.contentType);
  
  // instance
  // if (this.binary && !(data instanceof Buffer)) {
  //   data = new Buffer(data, 'binary');
  // }
  
  switch (this.contentType) {
    case 'application/json': return json || JSON.stringify(data); // in case it was already done
    default: if (this.binary) return data; else return data.toString();
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

// encode: (data) ->
//   
//   // content-type: guess if not present
//   @contentType =
//     if @contentType?
//       // expand if it's in short from, 'html' => 'text/html'
//       @resolveType @contentType
//     else
//       // if buffer => octet-stream; else try json; else plain text
//       if data instanceof Buffer
//         @resolveType 'binary'
//       else if typeof data is 'object'
//         json = JSON.stringify data
//         @resolveType 'json'
//       else
//         @resolveType 'plain'
//   
//   // binary
//   @binary = @checkBinary @contentType
//   
//   // instance
//   if @binary and not data instanceof Buffer
//     data = new Buffer(data, 'binary')
//   
//   switch @contentType
//     when "application/json"
//       json or JSON.stringify data  // in case it was already done
//     else
//       if @binary?
//         data
//       else
//         data.toString()

// Fills in a full content type based on a few defaults
Meta.prototype._resolveType = function(type) {
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
    
// Checks if the given content type is a binary format
Meta.prototype._isBinary = function(type) {
  return /octet|^image|^video/.test(type);
}




// defaults and keywords

Meta.defaults = {
  host: 'localhost',
  port: 8098,
  links: [],
  binary: false,
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
  'props',
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