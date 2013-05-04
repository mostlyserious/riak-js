/**
 * Module dependencies.
 */
var utils = require('./utils'),
  assert = require('assert');

/**
 * Abstract `Meta`, meant to be initialized further down the prototype chain.
 *
 * @param {Array} of {Object} arguments - args are all *mixed-in*, with rightmost objects having precedence -overwriting properties set on objects to its left-; and then initializing the `Meta` with resolved properties. There is special treatment for the `callback` to make it more convenient to consumers of this API
 *
 *  Example: `Meta.call(this, { bucket: '?', stream: true, key: 'key' }, { bucket: '_', callback: function() { console.log('test') }}, { bucket: 'bucket' });` results in an instance of `Meta` with properties: `{ bucket: 'bucket', key: 'key', stream: true, callback: function() { console.log('test') } }`
 *
 * @api private
 */
var Meta = function() {
  
  var args = Array.prototype.slice.call(arguments),
    options = Meta.defaults;
  
  args.forEach(function(arg) {
    
    if (!arg) return;
    
    // support for passing a callback directly as options, to simplify client code
    if (arg.callback === undefined) delete arg.callback;
    if (typeof arg === 'function') arg = { callback: arg };
    
    options = utils.mixin(options, arg);
    
  });
  
  // copy only `Meta` properties into `this`
  Object.keys(options).forEach(function(key) {
    if (~Meta.keywords.indexOf(key)) {
      this[key] = options[key];
    }
  }.bind(this));
  
  // lastly, set data
  this.loadData(options.data);
  
}

/**
 * Parse a Riak value into an object, and from available information does its best to determine a suitable encoder.
 *
 *     meta.parse("{\"a\":1}")  // => {a: 1}
 * 
 * @param {Buffer|Object} data
 * @return {Object}
 * @api private
 */
Meta.prototype.parse = function(data) {
  
  // normalize falsey values to undefined
  if (!data || !data.length) return undefined;
  
  switch (this.contentType) {
    case 'application/json': return JSON.parse(data.toString());
    case 'text/plain': return data.toString();
    default: return data;
  }

}

/**
 * Serialize an object trying to guess its content type
 *
 *     meta.serialize({ a: 1 })  // => "{\"a\":1}"
 * 
 * @param {Buffer|Object|Stream} data
 * @return {String|Object}
 * @api private
 */
Meta.prototype.serialize = function(data) {
  
  // special case for streams, do nothing
  if (typeof data.pipe == 'function' && typeof data.destroy == 'function') return data;
  
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
    case 'application/json': data = JSON.stringify(data);
  }
  
  return new Buffer(data);
}

/**
 * Mutator for `data`; serialize `data` as soon as it's set.
 *
 * @api public
 */
Meta.prototype.loadData = function(data) {
  if (data) data = this.serialize(data);
  this.data = data;
}

/**
 * Fills in a full content type based on a few defaults
 *
 * @api public
 */
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

/**
 * General defaults for all implementations.
 *
 * @api public
 */
Meta.defaults = {
  host: 'localhost',
  port: 8098,
  links: [],
  resource: 'riak',
  clientId: 'riak-js',
  contentEncoding: 'utf8',
  accept: 'multipart/mixed,application/json;q=0.7, */*;q=0.5',
  callback: function(err, data, meta) {
  },

  // reserved by riak-js
  logger: undefined, // stream to log with
  data: undefined, // attach request body data to meta
  encodeUri: false, // don't escape bucket/key URI components
  
  // content-type
  // see @serialize -- too complex to have just one simple default
  
}

/**
 * List of all allowed `Meta` properties. Other values are simply discarded.
 *
 * @api public
 */
Meta.keywords = [
  'host',
  'port',
  'bucket',
  'buckets',
  'logger',
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
  'accept',
  'data',
  'stream',
  'headers', // http, we want to keep these so that users can override headers (TODO check)
  'callback',
  'method',
  'q',
  'start',
  'rows',
  'wt',
  'sort',
  'presort',
  'filter',
  'fl',
  'noError404',
  'date',
  'operation',
  'pool',
  '_pool',
  'agent'
]

module.exports = Meta;
