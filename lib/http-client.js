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
  Mapper = require('./mapper');

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
 *
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
  
  this
    .add(bucket)
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


// Map/Reduce

/**
 * Add inputs for a Map/Reduce. Forms allowed:
 *
 *   - `String` for full-bucket scans
 *   - `Array` for a list of key/values
 *   - `Object` for key filters and further options. See Basho Map/Reduce documentation.
 * 
 * @param {String|Array|Object} inputs
 * @return {Mapper}
 * @api public
 */
HttpClient.prototype.add = function(inputs) {
  return new Mapper(inputs, this);
}

/**
 * Add inputs for a Map/Reduce from the result of a Riak Search query.
 *
 * @param {String} bucket - index
 * @param {String} query - Riak Search valid query
 * @return {Mapper}
 * @api public
 */
HttpClient.prototype.search = function(bucket, query) {
  return this.add({ module: 'riak_search', function: 'mapred_search', arg: [bucket, query] });
}

/**
 * Submits a Map/Reduce job. Internally called by `Mapper#run`.
 *
 * @param {Object} job
 * @param {Object} options [optional]
 * @param {Function} callback(err, results, meta) [optional]
 * @api private
 */
HttpClient.prototype._run = function(job, options, callback) {
  var Meta = _metaType(options);
  var meta = new Meta(this._defaults, options, { resource: 'mapred', method: 'post', callback: callback }),
    callback = meta.callback;

  meta.loadData(job.data);
  
  if (meta.chunked) {
    
    meta.callback = function(err, data, _meta) {
      if (_meta) delete _meta._emitter;
      callback(err, data, _meta);
    };
    meta._emitter = new EventEmitter();
    meta._emitter.start = function() { this._execute(meta) }.bind(this);

    return meta._emitter;
    
  }
  
  this._execute(meta);

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
  
  var self = this,
    callback = meta.callback;

  // logger
  if (meta.logger) meta.logger.write('[riak-js] ' + meta.method.toUpperCase() + ' ' + meta.path + '\n');
  
  var request = http.request(meta, function(response) {

    var headers = response.headers,
      buffer = [],
      boundary,
      tempBuffer = '';

    // remove agent
    delete meta.agent;
    
    meta.loadResponse(response);
    
    if (meta.stream) {
      return callback(null, response, meta);
    }
    
    response.on('data', function(chunk) {
      
      if (meta.transferEncoding == 'chunked' && meta._emitter) {
        
        // stream keys
        if (meta.keys == 'stream') {
          // only buffer the first chunk, the rest will be emitted
          if (buffer.length > 0) {
            buffer = chunk;
          } else {
          
            tempBuffer += chunk.toString();
        
            var m = tempBuffer.match(/\}\{|\}$/);
            if (m && m.index) { // whole or contiguous JSON chunks
            
              var head = tempBuffer.substr(0, m.index+1),
                tail = tempBuffer.substr(m.index+1);
              tempBuffer = tail;
          
              try {
                var keys = JSON.parse(head).keys;
                if (keys && keys.length) meta._emitter.emit('keys', keys);
              } catch (err) {
                this.emit('error', err);
              }
          
            }
        
          }
          
        }
        
        // chunked map/reduce
        if (meta.chunked && meta.boundary && meta.resource == 'mapred') {
          
          var chunks = meta._parseMultipartMixed(chunk.toString());
          
          // exactly the same as in `getAll`
          chunks.forEach(function(e) {
            var Meta = _metaType(meta);
            var _meta = new Meta({ contentType: e.headers['content-type'], data: e.body });
            meta._emitter.emit('data', _meta.parse(e.body));
          });
          
        }
        
      } else { // simply buffer
        buffer.push(chunk);
      }
      
    });
    
    response.on('end', function() {
      
      // if there is an emitter associated to this chunked response then emit 'end'
      if (meta._emitter) {
        meta._emitter.emit('end');
      }
      
      var bytesRead = buffer.reduce(function(p, c) { return p + c.length }, 0);
      var tempBuf = new Buffer(bytesRead),
        tempBytes = 0;
      buffer.forEach(function(chunk) {
        chunk.copy(tempBuf, tempBytes, 0, chunk.length);
        tempBytes += chunk.length;
      });
      buffer = tempBuf;
      
      try {
        buffer = meta.parse(buffer);
      } catch (e) {
        buffer = "Problem decoding: " + e.message;
      }
      
      // deal with errors
      if (meta.statusCode >= 400) {
        var err = new Error();
        err.message = buffer && buffer.toString().trim();
        err.statusCode = meta.statusCode;
        buffer = err;
      }
      
      if (meta.statusCode == 300 && meta.boundary) {
        var parts = meta._parseMultipartMixed(buffer);
        var Meta = _metaType(meta);
        buffer = parts.map(function(part) {
          var _meta = new Meta({data: part.body});
          _meta.loadResponse({
            headers: part.headers,
            statusCode: meta.statusCode
          })
          _meta.vclock = meta.vclock;
          return({
            meta: _meta, data: _meta.parse(_meta.data)
          })
        });
      }
     
      var err = null;
      
      if (buffer instanceof Error) {
        
        err = buffer;
        
        if (meta.statusCode === 404) {
          if (meta.noError404) {
            err = buffer = undefined;
          } else {
            err.notFound = true;
          }
        }
        
      }
      
      callback(err, buffer, meta);
      
    });
    
  });
  
  request.on('error', function(err) {
    self.emit('error', err);
  });
  
  // write stream
  if (meta.data && meta.data.pipe) {
    meta.data.pipe(request);
    return; // we're done
  }
  
  if (meta.data) {
    request.write(meta.data, meta.contentEncoding);
    delete meta.data;
  }
  
  request.end();
  
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
