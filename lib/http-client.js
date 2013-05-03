/**
 * Module dependencies.
 */
var http = require('http'),
  EventEmitter = require('events').EventEmitter,
  Client = require('./client'),
  util = require('util'),
  utils = require('./utils'),
  CoreMeta = require('./meta'),
  HttpMeta = require('./http-meta'),
  HttpRequest = require('./http-request'),
  HttpSearchClient = require('./http-search-client'),
  Mapper = require('./mapper'),
  HttpMapReduceClient = require('./http-mapreduce-client'),
  Pool = require('poolee');

/**
 * Initialize an HTTP client, which inherits from `Client`.
 * Accepts `options` that will act as defaults throughout the session,
 * overridable by `options` at a per-call level.
 *
 * @param {Object|Meta} options
 * @api public
 */
var HttpClient = function HttpClient(options) {
  Client.call(this, options);
  this._defaults = options || {};
  var execute = function(meta) {
    this._execute(meta)
  }.bind(this);
  this.search = new HttpSearchClient(this._defaults, execute);
  this.mapreduce = new HttpMapReduceClient(this._defaults, execute);
  var pool = this._defaults.pool;
  if (pool) {
    this._defaults._pool = new Pool(http, pool.servers, pool.options || {});
  }
}

util.inherits(HttpClient, Client);

/**
 * Perform a get call, fetch an object and its metadata.
 *
 * @param {String} bucket
 * @param {String} key
 * @param {Object|Meta} options [optional]
 * @param {Function} callback(err, data, meta) [optional]. If `stream: true`, `data` will be a `Stream`.
 * @api public
 */
HttpClient.prototype.get = function(bucket, key, options, callback) {
  var Meta = _metaType(options);
  var meta = new Meta(this._defaults, options, { bucket: bucket, key: key, method: 'get', callback: callback });
  this._execute(meta);
}

/**
 * Perform a linkwalk, fetch linked objects.
 *
 * @param {String} bucket
 * @param {String} key
 * @param {Array} links
 * @param {Object|Meta} options [optional]
 * @param {Function} callback(err, data, meta) [optional]. If `stream: true`, `data` will be a `Stream`.
 * @api public
 */
HttpClient.prototype.walk = function(bucket, key, links, options, callback) {
  if (typeof options === 'function' || options === undefined) {
    callback = options;
    options = {};
  }
  options.links = links;

  var Meta = _metaType(options);
  var meta = new Meta(this._defaults, options, { bucket: bucket, key: key, method: 'get', callback: callback });
  this._execute(meta);
}

/**
 * Perform a head call, via an HTTP HEAD request. Handy when only metadata (`Meta`) is needed.
 *
 * @param {String} bucket
 * @param {String} key
 * @param {Object|Meta} options [optional]
 * @param {Function} callback(err, _, meta) [optional]
 * @api public
 */
HttpClient.prototype.head = function(bucket, key, options, callback) {
  var Meta = _metaType(options);
  var meta = new Meta(this._defaults, options, { bucket: bucket, key: key, method: 'head', callback: callback });
  this._execute(meta);
}

/**
 * Check if an object exists, with use of the `db#head` call. Passes a {Boolean} `exists` in the callback.
 *
 * @param {String} bucket
 * @param {String} key
 * @param {Object|Meta} options [optional]
 * @param {Function} callback(err, exists, meta) [optional]
 * @api public
 */
HttpClient.prototype.exists = function(bucket, key, options, callback) {
  
  var Meta = _metaType(options);
  var meta = new Meta(this._defaults, options, { bucket: bucket, key: key, callback: callback });
  var callback = meta.callback;

  this.head(bucket, key, meta, function(err, data, meta) {
    if (meta && meta.statusCode === 404) {
      callback(null, false, meta);
    } else if (err) {
      callback(err);
    } else {
      callback(err, true, meta);
    }
  });
  
}

/**
 * Saves `data` to an object. Attempts to detect the content type, which can also be provided in the `options`.
 * If no key is supplied, Riak will assign one (which can be later retrieved with `meta.location`).
 * The stored object will only be returned if `options` contains `returnbody: true`.
 * @param {String} bucket
 * @param {String} key
 * @param {String|Object|Buffer|Stream} data
 * @param {Object|Meta} options [optional]
 * @param {Function} callback(err, _, meta) [optional]
 * @api public
 */
HttpClient.prototype.save = function(bucket, key, data, options, callback) {
  var Meta = _metaType(options);
  var method = key ? 'put' : 'post',
    meta = new Meta(this._defaults, { method: method }, options, { bucket: bucket, key: key, callback: callback });
  meta.loadData(data);
  this._execute(meta);
}

/**
 * Remove an object.
 *
 * @param {String} bucket
 * @param {String} key
 * @param {Object|Meta} options [optional]
 * @param {Function} callback(err, _, meta) [optional]
 * @api public
 */
HttpClient.prototype.remove = function(bucket, key, options, callback) {
  var Meta = _metaType(options);
  var meta = new Meta(this._defaults, options, { bucket: bucket, key: key, method: 'delete', callback: callback });
  this._execute(meta);
}

/**
 * Get all objects from the given `bucket`.
 *
 * WARNING: Not recommended to run in production systems, full bucket scans can be expensive.
 *
 * @param {String} bucket
 * @param {Object|Meta} options [optional]
 * @param {Function} callback(err, decodedObjects, meta) [optional]
 * @api public
 */
HttpClient.prototype.getAll = function(bucket, options, callback) {
  var Meta = _metaType(options);
  var meta = new Meta(this._defaults, options, { callback: callback });
  
  this.
    mapreduce.add(bucket)
    .map(function(v) {
      var contentType = v.values[0].metadata['content-type'],
        data = Riak.mapValues(v)[0];
      if (!data) return [];
      return [{ contentType: contentType, data: data }];
    })
    .reduce('Riak.filterNotFound')
    .run(function(err, results, _meta) {
      if (!err && results) results = results.map(function(result) {
        var meta = new Meta(result);
        return meta.parse(result.data);
      });
      meta.callback(err, results, _meta);
    });
  
}

// Buckets

/**
 * Get a list of all existing `buckets`.
 *
 * @param {Object|Meta} options [optional]
 * @param {Function} callback(err, buckets, meta) [optional]
 * @api public
 */
HttpClient.prototype.buckets = function(options, callback) {
  var Meta = _metaType(options);
  var meta = new Meta(this._defaults, options, { buckets: true, callback: callback }),
    callback = meta.callback;
  meta.callback = function(err, data, _meta) { callback(err, data.buckets, _meta) }
  this._execute(meta);
}

/**
 * Get a `bucket`'s properties.
 *
 * @param {String} bucket
 * @param {Object|Meta} options [optional]
 * @param {Function} callback(err, props, meta) [optional]
 * @api public
 */
HttpClient.prototype.getBucket = function(bucket, options, callback) {
  var Meta = _metaType(options);
  var meta = new Meta(this._defaults, options, { bucket: bucket, callback: callback }),
    callback = meta.callback;
  meta.callback = function(err, data, _meta) { callback(err, data.props, _meta) }
  this._execute(meta);
}

/**
 * Save a `bucket`'s properties. For example, used to set `n_val: 5` and `search: true`.
 *
 * @param {String} bucket
 * @param {Object} props (conforming to Riak bucket properties)
 * @param {Object|Meta} options [optional]
 * @param {Function} callback(err, _, meta) [optional]
 * @api public
 */
HttpClient.prototype.saveBucket = function(bucket, props, options, callback) {
  var Meta = _metaType(options);
  var meta = new Meta(this._defaults, options, { method: 'put', callback: callback });
  this.save(bucket, undefined, { props: props }, meta, meta.callback);
}

// Keys

/**
 * Get a bucket's keys. This call returns an `EventEmitter` on which the following events can be listened to:
 *
 *   - `keys` an `Array` of keys
 *   - `end` listing complete
 *
 * @param {String} bucket
 * @param {Object|Meta} options [optional]
 * @param {Function} callback(err, _, meta) [optional]. Note: `keys` won't be buffered or returned on the callback
 * @return {EventEmitter}
 * @api public
 */
HttpClient.prototype.keys = function(bucket, options, callback) {
  var Meta = _metaType(options);
  var meta = new Meta(this._defaults, options, { bucket: bucket, keys: 'stream', props: false, callback: callback }),
    callback = meta.callback;

  meta.callback = function(err, data, _meta) {
    if (_meta) delete _meta._emitter;
    callback(err, data, _meta);
  };
  meta._emitter = new EventEmitter();
  meta._emitter.start = function() { this._execute(meta) }.bind(this);
  
  return meta._emitter;

}

/**
 * Count keys in a bucket. Uses underlying key streaming, buffering key lengths from chunks.
 *
 * @param {String} bucket
 * @param {Object|Meta} options [optional]
 * @param {Function} callback(err, count, meta) [optional]
 * @api public
 */
HttpClient.prototype.count = function(bucket, options, callback) {
  var Meta = _metaType(options);
  var meta = new Meta(this._defaults, options, { callback: callback });
  
  var buffer = [],
    callback = meta.callback,
    stream = this.keys(bucket, meta, function(err, data, _meta) {
      // we assume all key lengths have been read and can be reduced
      // as callbacks are fired after 'end' events are emitted
      var total = buffer.reduce(function(p, c) { return p + c }, 0);
      callback(err, total, _meta);
    });
  
  stream.on('keys', function(keys) { buffer.push(keys.length) });
  
  stream.start();
  
}

// Luwak

/**
 * Get file from Luwak. See `HttpClient#get`.
 *
 * @param {String} key
 * @param {Object|Meta} options [optional]
 * @param {Function} callback(err, data, meta) [optional]
 * @api public
 */
HttpClient.prototype.getFile = function(key, options, callback) {
  var Meta = _metaType(options);
  var meta = new Meta(this._defaults, options, { resource: 'luwak', callback: callback });
  this.get(undefined, key, meta, meta.callback);
}

/**
 * Saves `data` to an object in Luwak. See `HttpClient#save`.
 *
 * @param {String} key
 * @param {String|Object|Buffer|Stream} data
 * @param {Object|Meta} options [optional]
 * @param {Function} callback(err, _, meta) [optional]
 * @api public
 */
HttpClient.prototype.saveFile = function(key, data, options, callback) {
  var Meta = _metaType(options);
  var meta = new Meta(this._defaults, options, { resource: 'luwak', callback: callback });
  this.save(undefined, key, data, meta, meta.callback);
}

/**
 * Remove file from Luwak. See `HttpClient#remove`.
 *
 * @param {String} key
 * @param {Object|Meta} options [optional]
 * @param {Function} callback(err, _, meta) [optional]
 * @api public
 */
HttpClient.prototype.removeFile = function(key, options, callback) {
  var Meta = _metaType(options);
  var meta = new Meta(this._defaults, options, { resource: 'luwak', callback: callback });
  this.remove(undefined, key, meta, meta.callback);
}

// 2i

/**
 * Query via Secondary Indices. 
 *
 * @param {String} key
 * @param {Object} query - keys match to string values for equality, to array for ranges. `{ sex: 'M', age: [20,30] }`.
 * @param {Object} options [optional]
 * @param {Function} callback(err, results, meta) [optional]
 * @api public
 */
HttpClient.prototype.query = function(bucket, query, options, callback) {
  var Meta = _metaType(options);
  var meta = new Meta(this._defaults, options, { resource: 'buckets', encodeUri: false, callback: callback });
  
  var field = Object.keys(query)[0],
    value = query[field],
    end = null;
  
  if (Array.isArray(value)) {
    end = value[1];
    value = value[0];
  }
  
  var type = typeof value == 'number' ? 'int' : 'bin',
    key = "index/" + field + "_" + type + "/" + encodeURIComponent(value);
  
  if (end) key += "/" + encodeURIComponent(end);
  
  this.get(bucket, key, meta, function(err, data, _meta) {
    data = data ? data.keys : undefined;
    meta.callback(err, data, _meta);
  });
  
}

// Other

/**
 * List available resources.
 *
 * @param {Object} options [optional]
 * @param {Function} callback(err, resources, meta) [optional]
 * @api public
 */
HttpClient.prototype.resources = function(options, callback) {
  var Meta = _metaType(options);
  var meta = new Meta(this._defaults, options, { accept: 'application/json', resource: '', callback: callback });
  this.get(undefined, undefined, meta, meta.callback);
}

/**
 * Ping the node.
 *
 * @param {Object} options [optional]
 * @param {Function} callback(err, ok, meta) [optional]
 * @api public
 */
HttpClient.prototype.ping = function(options, callback) {
  var Meta = _metaType(options);
  var meta = new Meta(this._defaults, options, { resource: 'ping', method: 'head', callback: callback });
  var callback = meta.callback;
  meta.callback = function(err, data, _meta) { callback(null, !err) }
  this._execute(meta);
}

/**
 * Get node stats.
 *
 * @param {Object} options [optional]
 * @param {Function} callback(err, stats, meta) [optional]
 * @api public
 */
HttpClient.prototype.stats = function(options, callback) {
  var Meta = _metaType(options);
  var meta = new Meta(this._defaults, options, { resource: 'stats', callback: callback });
  this._execute(meta);
}

module.exports = HttpClient;


/****************************/

/**
 * Perform requests with node.js HTTP library.
 *
 * @param {Meta} meta - an object containing all necessary information to carry out the request
 * @api private
 */
HttpClient.prototype._execute = function(meta) {
  new HttpRequest(this, meta).execute();
}

HttpClient.prototype._metaType = function(options) {
  return _metaType(options);
}

/**
 * Utility function to determine whether to use the default constructor HttpMeta, or a subclass
 *
 * @param {Object|Meta} options
 * @return {HttpMeta} an `HttpMeta` constructor or a subclass of it
 * @api private
 */
var _metaType = function(options) {
  return options instanceof HttpMeta ? options.constructor : HttpMeta;
}
