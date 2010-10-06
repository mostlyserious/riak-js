var Client, Http, HttpClient, Mapper, Meta, Utils;
var __slice = Array.prototype.slice, __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
Client = require('./client');
Meta = require('./http_meta');
Mapper = require('./mapper');
Utils = require('./utils');
Http = require('http');
HttpClient = function(options) {
  var _ref, host, port;
  _ref = ['localhost', 8098];
  host = _ref[0];
  port = _ref[1];
  HttpClient.__super__.constructor.call(this, options);
  this.client = Http.createClient(((typeof options === "undefined" || options === null) ? undefined : options.port) || port, ((typeof options === "undefined" || options === null) ? undefined : options.host) || host);
  return this;
};
__extends(HttpClient, Client);
HttpClient.prototype.get = function(bucket, key) {
  var _ref, callback, meta, options;
  options = __slice.call(arguments, 2);
  _ref = this.ensure(options);
  options = _ref[0];
  callback = _ref[1];
  meta = new Meta(bucket, key, options);
  return this.execute('GET', meta)(__bind(function(data, meta) {
    return this.executeCallback(data, meta, callback);
  }, this));
};
HttpClient.prototype.head = function(bucket, key) {
  var _ref, callback, meta, options;
  options = __slice.call(arguments, 2);
  _ref = this.ensure(options);
  options = _ref[0];
  callback = _ref[1];
  meta = new Meta(bucket, key, options);
  return this.execute('HEAD', meta)(__bind(function(data, meta) {
    return this.executeCallback(data, meta, callback);
  }, this));
};
HttpClient.prototype.getAll = function(bucket) {
  var _ref, callback, mapfunc, options;
  options = __slice.call(arguments, 1);
  _ref = this.ensure(options);
  options = _ref[0];
  callback = _ref[1];
  mapfunc = function(v, k, options) {
    var data, keys;
    data = options.noJSON ? Riak.mapValues(v)[0] : Riak.mapValuesJson(v)[0];
    if (options.where && !options.noJSON) {
      keys = [];
      for (var i in options.where) keys.push(i);
      if (keys.some(function(k) {
        return options.where[k] !== data[k];
      })) {
        return [];
      }
    }
    delete v.values;
    return [
      {
        meta: v,
        data: data
      }
    ];
  };
  return this.add(bucket).map(mapfunc, options).run(callback);
};
HttpClient.prototype.keys = function(bucket) {
  var _ref, callback, meta, options;
  options = __slice.call(arguments, 1);
  _ref = this.ensure(options);
  options = _ref[0];
  callback = _ref[1];
  options.keys = true;
  meta = new Meta(bucket, '', options);
  return this.execute('GET', meta)(__bind(function(data, meta) {
    return this.executeCallback(data.keys, meta, callback);
  }, this));
};
HttpClient.prototype.count = function(bucket) {
  var _ref, callback, options;
  options = __slice.call(arguments, 1);
  _ref = this.ensure(options);
  options = _ref[0];
  callback = _ref[1];
  return this.add(bucket).map(function(v) {
    return [1];
  }).reduce(['Riak.filterNotFound', 'Riak.reduceSum']).run(callback);
};
HttpClient.prototype.walk = function(bucket, key, spec) {
  var _ref, callback, linkPhases, options;
  options = __slice.call(arguments, 3);
  _ref = this.ensure(options);
  options = _ref[0];
  callback = _ref[1];
  linkPhases = spec.map(function(unit) {
    return {
      bucket: unit[0] || '_',
      tag: unit[1] || '_',
      keep: !!unit[2]
    };
  });
  return this.link(linkPhases).reduce({
    language: 'erlang',
    module: 'riak_kv_mapreduce',
    "function": 'reduce_set_union'
  }).map('Riak.mapValuesJson').run(key ? [[bucket, key]] : bucket, options, callback);
};
HttpClient.prototype.save = function(bucket, key, data) {
  var _ref, callback, meta, options, verb;
  options = __slice.call(arguments, 3);
  _ref = this.ensure(options);
  options = _ref[0];
  callback = _ref[1];
  data || (data = {});
  meta = new Meta(bucket, key, options);
  meta.data = data;
  verb = options.method || (key ? 'PUT' : 'POST');
  return this.execute(verb, meta)(__bind(function(data, meta) {
    return this.executeCallback(data, meta, callback);
  }, this));
};
HttpClient.prototype.remove = function(bucket, key) {
  var _ref, callback, meta, options;
  options = __slice.call(arguments, 2);
  _ref = this.ensure(options);
  options = _ref[0];
  callback = _ref[1];
  meta = new Meta(bucket, key, options);
  return this.execute('DELETE', meta)(__bind(function(data, meta) {
    return this.executeCallback(data, meta, callback);
  }, this));
};
HttpClient.prototype.add = function(inputs) {
  return new Mapper(this, inputs);
};
HttpClient.prototype.runJob = function(options, callback) {
  options.raw = 'mapred';
  return this.save('', '', options.data, options, callback);
};
HttpClient.prototype.end = function() {};
HttpClient.prototype.getProps = function(bucket) {
  var _ref, callback, options;
  options = __slice.call(arguments, 1);
  _ref = this.ensure(options);
  options = _ref[0];
  callback = _ref[1];
  return this.get(bucket, undefined, options, callback);
};
HttpClient.prototype.updateProps = function(bucket, props) {
  var _ref, callback, options;
  options = __slice.call(arguments, 2);
  _ref = this.ensure(options);
  options = _ref[0];
  callback = _ref[1];
  options.method = 'PUT';
  return this.save(bucket, undefined, {
    props: props
  }, options, callback);
};
HttpClient.prototype.ping = function(callback) {
  var meta;
  meta = new Meta('', '', {
    raw: 'ping'
  });
  return this.execute('HEAD', meta)(__bind(function(data, meta) {
    return this.executeCallback(true, meta, callback);
  }, this));
};
HttpClient.prototype.stats = function(callback) {
  var meta;
  meta = new Meta('', '', {
    raw: 'stats'
  });
  return this.execute('GET', meta)(__bind(function(data, meta) {
    return this.executeCallback(data, meta, callback);
  }, this));
};
HttpClient.prototype.execute = function(verb, meta) {
  return __bind(function(callback) {
    var buffer, cbFired, onClose, path, request;
    verb = verb.toUpperCase();
    path = meta.path;
    this.log("" + (verb) + " " + (path));
    request = this.client.request(verb, path, meta.toHeaders());
    if (meta.data) {
      request.write(meta.encodeData(), meta.contentEncoding);
      delete meta.data;
    }
    cbFired = false;
    onClose = __bind(function(hadError, reason) {
      if (hadError && !cbFired) {
        callback(new Error(reason));
      }
      return this.client.removeListener('close', onClose);
    }, this);
    this.client.on('close', onClose);
    this.client.on('error', function(err) {
      return onClose(true, err);
    });
    buffer = '';
    request.on('response', __bind(function(response) {
      response.setEncoding(meta.usermeta.responseEncoding || 'utf8');
      response.on('data', function(chunk) {
        return buffer += chunk;
      });
      return response.on('end', __bind(function() {
        var boundary, err;
        meta = meta.loadResponse(response);
        buffer = (function() {
          if ((400 <= meta.statusCode) && (meta.statusCode < 600)) {
            err = new Error("HTTP error " + (meta.statusCode) + ": " + (buffer));
            if (meta.statusCode === 404) {
              err.message = undefined;
            }
            err.statusCode = meta.statusCode;
            return err;
          } else {
            return this.decodeBuffer(buffer, meta);
          }
        }).call(this);
        if (meta.statusCode === 300 && meta.contentType.match(/^multipart\/mixed/)) {
          boundary = Utils.extractBoundary(meta.contentType);
          buffer = Utils.parseMultipart(buffer, boundary).map(__bind(function(doc) {
            var _meta;
            _meta = new Meta(meta.bucket, meta.key);
            _meta.loadResponse({
              headers: doc.headers,
              statusCode: meta.statusCode
            });
            _meta.vclock = meta.vclock;
            return {
              meta: _meta,
              data: this.decodeBuffer(doc.body, _meta)
            };
          }, this));
        }
        cbFired = true;
        return callback(buffer, meta);
      }, this));
    }, this));
    return request.end();
  }, this);
};
HttpClient.prototype.decodeBuffer = function(buffer, meta) {
  if (meta.contentType === 'application/octet-stream') {
    return new Buffer(buffer, 'binary');
  } else {
    try {
      return buffer.length > 0 ? meta.decode(buffer) : undefined;
    } catch (e) {
      return new Error("Cannot convert response into " + (meta.contentType) + ": " + (e.message) + " -- Response: " + (buffer));
    }
  }
};
HttpClient.prototype.metaClass = Meta;
module.exports = HttpClient;