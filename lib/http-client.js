var http = require('http'),
  EventEmitter = require('events').EventEmitter,
  Client = require('./client'),
  util = require('util'),
  utils = require('./utils'),
  Meta = require('./http-meta'),
  Mapper = require('./mapper');

var HttpClient = function HttpClient(options) {
  Client.call(this, options);
  this._defaults = options || {};
}

util.inherits(HttpClient, Client);

// basic

HttpClient.prototype.get = function(bucket, key, options, callback) {
  options = this._prepare(options, { bucket: bucket, key: key, method: 'get' }, callback);
  var meta = new Meta(options);
  this._execute(meta);
}

HttpClient.prototype.head = function(bucket, key, options, callback) {
  options = this._prepare(options, { bucket: bucket, key: key, method: 'head' }, callback)
  var meta = new Meta(options);
  this._execute(meta);
}

HttpClient.prototype.exists = function(bucket, key, options, callback) {

  options = this._prepare(options, { bucket: bucket, key: key }, callback);
  callback = options._callback;

  this.head(bucket, key, options, function(err, data, meta) {
    if (meta && meta.statusCode === 404) {
      callback(null, false, meta);
    } else if (err) {
      callback(err);
    } else {
      callback(err, true, meta);
    }
  });
  
}

HttpClient.prototype.save = function(bucket, key, data, options, callback) {
  var method = (options && options.method) || key ? 'put' : 'post';
  options = this._prepare(options, { bucket: bucket, key: key, method: method }, callback);  
  options.data = data;
  
  var meta = new Meta(options);
  this._execute(meta);
}

HttpClient.prototype.remove = function(bucket, key, options, callback) {
  options = this._prepare(options, { bucket: bucket, key: key, method: 'delete' }, callback);
  var meta = new Meta(options);
  this._execute(meta);
}

//

HttpClient.prototype.getAll = function(bucket, options, callback) {
  options = this._prepare(options, {}, callback);
  
  this
    .add(bucket)
    .map(function(v) {
      var contentType = v.values[0].metadata['content-type'],
        data = Riak.mapValues(v)[0];
      if (!data) return [];
      return [{ contentType: contentType, data: data }];
    })
    .reduce('Riak.filterNotFound')
    .run(function(err, results, meta) {
      if (!err && results) results = results.map(function(result) {
        var meta = new Meta(result);
        return meta.decode(result.data);
      });
      options._callback(err, results, meta);
    });
  
}

// buckets

HttpClient.prototype.buckets = function(options, callback) {
  options = this._prepare(options, { buckets: true }, callback);
  callback = options._callback;
  var meta = new Meta(options);
  meta._callback = function(err, data, _meta) { callback(err, data.buckets, _meta) }
  this._execute(meta);
}

HttpClient.prototype.getBucket = function(bucket, options, callback) {
  options = this._prepare(options, { bucket: bucket }, callback);
  callback = options._callback;
  var meta = new Meta(options);
  meta._callback = function(err, data, _meta) { callback(err, data.props, _meta) }
  this._execute(meta);
}

HttpClient.prototype.saveBucket = function(bucket, props, options, callback) {
  options = this._prepare(options, { method: 'put' }, callback);
  this.save(bucket, undefined, { props: props }, options, options._callback);
}

// keys

HttpClient.prototype.keys = function(bucket, options, callback) {
  options = this._prepare(options, { bucket: bucket, keys: 'stream', props: false }, callback);
  
  var callback = function(err, data, _meta) {
    if (_meta) delete _meta._emitter;
    options._callback(err, data, _meta);
  }
  
  var meta = new Meta(options);
  meta._callback = callback;
  meta._emitter = new EventEmitter();
  meta._emitter.start = function() { this._execute(meta) }.bind(this);
  
  return meta._emitter;

}

HttpClient.prototype.count = function(bucket, options, callback) {
  options = this._prepare(options, {}, callback);
  
  var buffer = [],
    stream = this.keys(bucket, options, function(err, data, meta) {
      var total = buffer.reduce(function(p, c) { return p + c }, 0);
      options._callback(err, total, meta);
    });
  
  stream.on('keys', function(keys) { buffer.push(keys.length) });
  
  stream.start();
  
}

// luwak

HttpClient.prototype.getFile = function(key, options, callback) {
  // TODO is the order options, additionalOptions ok?
  options = this._prepare(options, { resource: 'luwak' }, callback);
  this.get(undefined, key, options, options._callback);
}

HttpClient.prototype.saveFile = function(key, data, options, callback) {
  options = this._prepare(options, { resource: 'luwak' }, callback);
  this.save(undefined, key, data, options, options._callback);
}

HttpClient.prototype.removeFile = function(key, options, callback) {
  options = this._prepare(options, { resource: 'luwak' }, callback);
  this.remove(undefined, key, options, options._callback);
}

// 2i

HttpClient.prototype.query = function(bucket, query, options, callback) {
  options = this._prepare(options, { resource: 'buckets', encodeUri: false }, callback);
  
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
  
  this.get(bucket, key, options, function(err, data, meta) {
    data = data ? data.keys : undefined;
    options._callback(err, data, meta);
  });
  
}


// map/reduce

HttpClient.prototype.add = function(inputs) {
  return new Mapper(inputs, this);
}

HttpClient.prototype.search = function(index, query) {
  return this.add({ module: 'riak_search', function: 'mapred_search', arg: [index, query] });
}

HttpClient.prototype._run = function(job, options, callback) {
  options = this._prepare(options, { resource: 'mapred' }, callback);
  this.save(undefined, undefined, job.data, options, options._callback);
}

// other

HttpClient.prototype.resources = function(options, callback) {
  options = this._prepare(options, { accept: 'application/json', resource: '' }, callback);
  this.get(undefined, undefined, options, options._callback);
}

HttpClient.prototype.ping = function(options, callback) {
  options = this._prepare(options, { resource: 'ping', method: 'head' }, callback);
  callback = options._callback;
  var meta = new Meta(options);
  meta._callback = function(err, data, _meta) { callback(null, !err) }
  this._execute(meta);
}

HttpClient.prototype.stats = function(options, callback) {
  options = this._prepare(options, { resource: 'stats' }, callback);
  var meta = new Meta(options);
  this._execute(meta);
}

module.exports = HttpClient;


/****************************/


// private

HttpClient.prototype._defaultCallback = function(err, data, meta) {
  if (data) console.log(data);
}

HttpClient.prototype._prepare = function(options, additionalOptions, callback) {
  
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  
  options = utils.mixin(this._defaults, options || {}, additionalOptions || {});
  
  options._callback = callback || this._defaultCallback;
  
  return options;
  
}

HttpClient.prototype._execute = function(meta) {
  
  var self = this,
    callback = meta._callback;
    
  var request = http.request(meta, function(response) {
    
    // remove agent
    delete meta.agent;
    
    meta = meta.loadResponse(response);
    
    if (meta.stream) {
      return callback(null, response, meta);
    }
    
    var headers = response.headers,
      buffer = [],
      tempBuffer = '';
    
    response.on('data', function(chunk) {
      
      if (meta.transferEncoding == 'chunked' && meta._emitter) {
        
        // stream keys
        if (meta.keys == 'stream' && meta._emitter) {
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
        
        // TODO stream map/reduce
        
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
        buffer = meta.decode(buffer);
      } catch (e) {
        buffer = "Problem decoding: " + e.message;
      }
      
      // deal with errors
      if (meta.statusCode >= 400) {
        var err = new Error();
        err.message = buffer;
        err.statusCode = meta.statusCode;
        buffer = err;
      }
      
      // TODO http 300 logic
      
      // if meta.statusCode is 300 and meta.contentType.match /^multipart\/mixed/ # multiple choices
      //   boundary = Utils.extractBoundary meta.contentType
      //   buffer = Utils.parseMultipart(buffer, boundary).map (doc) =>
      //     _meta = new Meta(meta.bucket, meta.key)
      //     _meta.loadResponse { headers: doc.headers, statusCode: meta.statusCode }
      //     _meta.vclock = meta.vclock
      //     { meta: _meta, data: @decodeBuffer(doc.body, _meta, verb) }
      
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