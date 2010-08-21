var Client, HttpClient, HttpPool, Meta, Utils, p;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__superClass__ = parent.prototype;
  };
Client = require('./client');
Meta = require('./meta');
Utils = require('./utils');
HttpPool = require('./http_pool');
p = require('sys').p;
HttpClient = function(options) {
  this.defaults = {
    port: 8098,
    host: 'localhost',
    clientId: 'riak-js',
    method: 'GET',
    interface: 'riak',
    headers: {
      'Host': (this.options == null ? undefined : this.options.host) || 'localhost'
    },
    debug: true,
    callback: __bind(function(response, meta) {
      return this.log(response, {
        json: ((typeof meta === "undefined" || meta === null) ? undefined : meta.contentType) === 'application/json'
      });
    }, this)
  };
  this.defaults = Utils.mixin({}, this.defaults, options);
  this.pool || (this.pool = HttpPool.createPool(this.defaults.port, this.defaults.host));
  delete this.defaults.host;
  delete this.defaults.port;
  return this;
};
__extends(HttpClient, Client);
HttpClient.prototype.log = function(string, options) {
  options || (options = {});
  if (string) {
    if (options.json) {
      string = JSON.stringify(string);
    }
    if (console && (this.defaults.debug || options.debug)) {
      return console.log(string);
    }
  }
};
HttpClient.prototype.get = function(bucket, key, options) {
  return __bind(function(callback) {
    var meta;
    meta = new Meta(bucket, key, options);
    return this.execute(meta)(__bind(function(data, meta) {
      return callback(data, meta);
    }, this));
  }, this);
};
HttpClient.prototype.save = function(bucket, key, data, options) {
  return __bind(function(callback) {
    var _a, meta;
    _a = [data || {}, options || {}];
    data = _a[0];
    options = _a[1];
    if (!options.method) {
      options.method = key ? 'PUT' : 'POST';
    }
    meta = new Meta(bucket, key, options);
    meta.content = {
      value: meta.encode(data),
      contentType: meta.contentType,
      charset: meta.charset,
      contentEncoding: meta.contentEncoding
    };
    return this.execute(meta)(__bind(function(data, meta) {
      return callback(data, meta);
    }, this));
  }, this);
};
HttpClient.prototype.remove = function(bucket, key, options) {
  return __bind(function(callback) {
    var meta;
    options || (options = {});
    options.method = 'DELETE';
    meta = new Meta(bucket, key, options);
    return this.execute(meta)(__bind(function(data, meta) {
      return callback(data, meta);
    }, this));
  }, this);
};
HttpClient.prototype.map = function(phase, args) {
  return new Mapper(this, 'map', phase, args);
};
HttpClient.prototype.reduce = function(phase, args) {
  return new Mapper(this, 'reduce', phase, args);
};
HttpClient.prototype.link = function(phase) {
  return new Mapper(this, 'link', phase);
};
HttpClient.prototype.ping = function() {
  return __bind(function(callback) {
    var meta, options;
    options = {
      interface: 'ping',
      method: 'head'
    };
    meta = new Meta('', '', options);
    return this.execute(meta)(__bind(function(data, meta) {
      return callback(meta.statusCode, meta);
    }, this));
  }, this);
};
HttpClient.prototype.end = function() {
  return this.pool.end();
};
HttpClient.prototype.execute = function(meta) {
  return __bind(function(callback) {
    var options, path, query, url;
    url = Utils.path(meta.bucket, meta.key);
    options = Utils.mixin(true, {}, this.defaults, meta.usermeta);
    query = null;
    path = ("/" + (options.interface) + "/" + (url) + (query ? '?' + query : ''));
    callback = callback || this.defaults.callback;
    options.headers = {
      Host: 'localhost',
      'content-type': meta.contentType,
      'If-None-Match': options.etag,
      'If-Modified-Since': options.lastModified
    };
    if (options.headers['X-Riak-Vclock']) {
      options.headers['X-Riak-ClientId'] = options.clientId;
    }
    this.log("" + (options.method.toUpperCase()) + " " + (path));
    if ((typeof meta === "undefined" || meta === null) ? undefined : meta.content == null ? undefined : meta.content.value) {
      options.headers.Connection = 'close';
    }
    return this.pool.request(options.method.toUpperCase(), path, options.headers, __bind(function(request) {
      var buffer;
      if ((typeof meta === "undefined" || meta === null) ? undefined : meta.content == null ? undefined : meta.content.value) {
        request.write(meta.content.value, meta.contentEncoding);
      }
      buffer = new String();
      request.on('response', function(response) {
        response.on('data', function(chunk) {
          return buffer += chunk;
        });
        return response.on('end', __bind(function() {
          meta = new Meta('', '', response.headers);
          meta.contentType = response.headers['content-type'];
          meta.statusCode = response.statusCode;
          buffer = buffer === !'' ? meta.decode(buffer) : buffer;
          return callback(buffer, meta);
        }, this));
      });
      return request.end();
    }, this));
  }, this);
};
module.exports = HttpClient;