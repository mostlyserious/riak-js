var http = require('http'),
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
  options = this._prepare(options, { bucket: bucket, key: key, method: 'GET' }, callback);
  var meta = new Meta(options);
  this._execute(meta);
}

HttpClient.prototype.head = function(bucket, key, options, callback) {
  options = this._prepare(options, { bucket: bucket, key: key, method: 'HEAD' }, callback)
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
  var method = key ? 'put' : 'post';
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

// bucket

HttpClient.prototype.buckets = function(options, callback) {
  options = this._prepare(options, { buckets: true }, callback);
  callback = options._callback;
  var meta = new Meta(options);
  meta._callback = function(err, data, _meta) { callback(err, data.buckets, _meta) }
  this._execute(meta);
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
  this.save(undefined, key, data, options, callback);
  
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
    callback(err, data, meta);
  });
  
}


// map/reduce

HttpClient.prototype.add = function(inputs) {
  return new Mapper(inputs, this);
}

HttpClient.prototype.addSearch = function(index, query) {
  return this.add({ module: 'riak_search', function: 'mapred_search', arg: [index, query] });
}

HttpClient.prototype._run = function(job, options, callback) {
  options = this._prepare(options, { resource: 'mapred' }, callback);
  this.save(undefined, undefined, job.data, options, options._callback);
}

// node commands

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

HttpClient.prototype._prepare = function(options, additionalOptions, callback) {
  
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  
  options = utils.mixin(this._defaults, options || {}, additionalOptions || {});
  
  options._callback = callback || function(err, data, meta) {
    console.log(data);
  }
  
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
      buffer = [];
    
    response.on('data', function(chunk) {
      buffer.push(chunk);
    });
    
    response.on('end', function() {
      
      var bytesRead = buffer.reduce(function(p, c) { return p + c.length }, 0);
      var tempBuf = new Buffer(bytesRead),
        tempBytes = 0;
      buffer.forEach(function(chunk) {
        chunk.copy(tempBuf, tempBytes, 0, chunk.length);
        tempBytes += chunk.length;
      });
      buffer = tempBuf;      
      
      // deal with errors
      if (meta.statusCode >= 400) {
        var err = new Error();
        err.message = buffer;
        err.statusCode = meta.statusCode;
        buffer = err;
      } else { // decode buffer
        try {
          buffer = meta.decode(buffer);
        } catch (e) {
          buffer = new Error('cannot convert resp');
        }        
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