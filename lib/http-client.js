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
    
    response.setEncoding(meta.responseEncoding);
    
    var buffer = '';
    
    response.on('data', function(chunk) {
      buffer += chunk;
    });
    
    response.on('end', function() {
      
      meta = meta.loadResponse(response);
      
      if (meta.statusCode >= 400) {
        var err = new Error("HTTP error " + meta.statusCode + ": " + buffer);
        err.statusCode = meta.statusCode;
        buffer = err;
      }
      
      // decode buffer
      try {
        buffer = meta.decode(buffer);
      } catch (e) {
        buffer = new Error('cannot convert resp');
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
  
  if (meta.data) {
    request.write(meta.data, meta.contentEncoding);
    delete meta.data;
  }
  
  request.on('error', function(err) {
    self.emit('error', err);
  });
  
  request.end();
  
}