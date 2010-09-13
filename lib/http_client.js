(function() {
  var Client, CoreMeta, HttpClient, HttpPool, Link, Mapper, Meta, Utils, querystring;
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
  Client = require('./client');
  CoreMeta = require('./meta');
  Mapper = require('./mapper');
  Utils = require('./utils');
  HttpPool = require('./http_pool');
  querystring = require('querystring');
  HttpClient = function(options) {
    this.defaults = {
      port: 8098,
      host: 'localhost',
      clientId: 'riak-js',
      host: (this.options == null ? undefined : this.options.host) || 'localhost',
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
  HttpClient.prototype.keys = function(bucket, options) {
    return __bind(function(callback) {
      var meta;
      options || (options = {});
      options.keys = true;
      meta = new Meta(bucket, '', options);
      return this.execute('GET', meta)(__bind(function(data, meta) {
        return callback(data.keys, meta);
      }, this));
    }, this);
  };
  HttpClient.prototype.get = function(bucket, key, options) {
    return __bind(function(callback) {
      var meta;
      meta = new Meta(bucket, key, options);
      return this.execute('GET', meta)(__bind(function(data, meta) {
        return callback(data, meta);
      }, this));
    }, this);
  };
  HttpClient.prototype.save = function(bucket, key, data, options) {
    return __bind(function(callback) {
      var meta, verb;
      data || (data = {});
      options || (options = {});
      meta = new Meta(bucket, key, options);
      meta.data = data;
      verb = key ? 'PUT' : 'POST';
      return this.execute(verb, meta)(__bind(function(data, meta) {
        return callback(data, meta);
      }, this));
    }, this);
  };
  HttpClient.prototype.remove = function(bucket, key, options) {
    return __bind(function(callback) {
      var meta;
      options || (options = {});
      meta = new Meta(bucket, key, options);
      return this.execute('DELETE', meta)(__bind(function(data, meta) {
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
  HttpClient.prototype.runJob = function(options) {
    return __bind(function(callback) {
      options.raw = 'mapred';
      return this.save('', '', options.data, options)(callback);
    }, this);
  };
  HttpClient.prototype.ping = function() {
    return __bind(function(callback) {
      var meta, options;
      options = {
        raw: 'ping'
      };
      meta = new Meta('', '', options);
      return this.execute('HEAD', meta)(__bind(function(data, meta) {
        return callback(true, meta);
      }, this));
    }, this);
  };
  HttpClient.prototype.end = function() {
    return this.pool.end();
  };
  HttpClient.prototype.execute = function(verb, meta) {
    return __bind(function(callback) {
      var headers, options, path, query, queryProps, url;
      url = ("/" + (meta.raw) + "/" + (meta.bucket) + "/" + (meta.key || ''));
      options = Utils.mixin(true, {}, this.defaults, meta.usermeta);
      verb = verb.toUpperCase();
      queryProps = {};
      ['r', 'w', 'dw', 'keys', 'props', 'vtag', 'nocache', 'returnbody'].forEach(function(prop) {
        if (options[prop] !== undefined) {
          return (queryProps[prop] = options[prop]);
        }
      });
      query = this.stringifyQuery(queryProps);
      path = ("" + (url) + (query ? '?' + query : ''));
      callback = callback || this.defaults.callback;
      headers = meta.toHeaders();
      this.log("" + (verb) + " " + (path));
      if (verb !== 'GET') {
        headers.Connection = 'close';
      }
      return this.pool.request(verb, path, headers, __bind(function(request) {
        var buffer;
        if (meta.data) {
          request.write(meta.encode(meta.data), meta.contentEncoding);
          delete meta.data;
        }
        buffer = new String();
        request.on('response', function(response) {
          response.on('data', function(chunk) {
            return buffer += chunk;
          });
          return response.on('end', __bind(function() {
            meta.load(meta.convertOptions(response.headers));
            meta.statusCode = response.statusCode;
            if (buffer.length > 0) {
              buffer = meta.decode(buffer);
            }
            if (meta.statusCode === 404) {
              buffer = undefined;
            }
            return callback(buffer, meta);
          }, this));
        });
        return request.end();
      }, this));
    }, this);
  };
  HttpClient.prototype.stringifyQuery = function(query) {
    var _a, key, value;
    _a = query;
    for (key in _a) {
      if (!__hasProp.call(_a, key)) continue;
      value = _a[key];
      if (typeof value === 'boolean') {
        query[key] = String(value);
      }
    }
    return querystring.stringify(query);
  };
  Meta = function() {
    return CoreMeta.apply(this, arguments);
  };
  __extends(Meta, CoreMeta);
  Meta.prototype.convertOptions = function(options) {
    if (!(options)) {
      return {};
    }
    options.contentType = options['content-type'];
    options.vclock = options['x-riak-vclock'];
    options.lastMod = options['last-modified'];
    options.links = this.stringToLinks(options['link']);
    return options;
  };
  Meta.prototype.toHeaders = function() {
    var headers;
    headers = {
      'Host': this.usermeta.host || 'localhost',
      'content-type': this.contentType,
      'If-None-Match': this.etag,
      'If-Modified-Since': this.lastMod,
      'link': this.linksToString()
    };
    if (headers['X-Riak-Vclock']) {
      headers['X-Riak-ClientId'] = meta.clientId || 'riak-js';
    }
    return headers;
  };
  Meta.prototype.stringToLinks = function(links) {
    var result;
    result = [];
    if (links) {
      links.split(',').forEach(function(link) {
        var _a, _b, captures, i;
        captures = link.trim().match(/^<\/(.*)\/(.*)\/(.*)>;\sriaktag="(.*)"$/);
        if (captures) {
          _b = captures;
          for (i in _b) {
            if (!__hasProp.call(_b, i)) continue;
            _a = _b[i];
            captures[i] = decodeURIComponent(captures[i]);
          }
          return result.push(new Link({
            bucket: captures[2],
            key: captures[3],
            tag: captures[4]
          }));
        }
      });
    }
    return result;
  };
  Meta.prototype.linksToString = function() {
    return this.links.map(__bind(function(link) {
      return "</" + (this.raw) + "/" + (link.bucket) + "/" + (link.key) + ">; riaktag=\"" + (link.tag || "_") + "\"";
    }, this)).join(", ");
  };
  Link = function(options) {
    this.bucket = options.bucket;
    this.key = options.key;
    this.tag = options.tag;
    return this;
  };
  module.exports = HttpClient;
})();
