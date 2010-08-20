(function() {
  var Client, CoreMeta, Meta, Pool, ProtoBufClient;
  var __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__superClass__ = parent.prototype;
  }, __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
  Client = require('./client');
  Pool = require('./protobuf');
  CoreMeta = require('./meta');
  Meta = function() {
    return CoreMeta.apply(this, arguments);
  };
  __extends(Meta, CoreMeta);
  Meta.prototype.withContent = function(body) {
    this.content = {
      value: this.encode(body),
      contentType: this.contentType,
      charset: this.charset,
      contentEncoding: this.contentEncoding
    };
    return this;
  };
  ProtoBufClient = function() {
    return Client.apply(this, arguments);
  };
  __extends(ProtoBufClient, Client);
  ProtoBufClient.prototype.get = function(bucket, key, options) {
    return __bind(function(callback) {
      var meta;
      meta = new Meta(bucket, key, options);
      return this.pool.send("GetReq", meta)(__bind(function(data) {
        return callback(this.processValueResponse(meta, data), meta);
      }, this));
    }, this);
  };
  ProtoBufClient.prototype.save = function(bucket, key, body, options) {
    return __bind(function(callback) {
      var meta;
      meta = new Meta(bucket, key, options);
      return this.pool.send("PutReq", meta.withContent(body))(__bind(function(data) {
        return callback(this.processValueResponse(meta, data), meta);
      }, this));
    }, this);
  };
  ProtoBufClient.prototype.remove = function(bucket, key, options) {
    return __bind(function(callback) {
      var meta;
      meta = new Meta(bucket, key, options);
      return this.pool.send("DelReq", meta)(function(data) {
        return callback(data);
      });
    }, this);
  };
  ProtoBufClient.prototype.ping = function() {
    return __bind(function(callback) {
      return this.pool.send('PingReq')(function(data) {
        return callback(data);
      });
    }, this);
  };
  ProtoBufClient.prototype.end = function() {
    return this.pool.end();
  };
  ProtoBufClient.prototype.buckets = function() {
    return __bind(function(callback) {
      return this.pool.send('ListBucketsReq')(function(data) {
        return callback(data.buckets);
      });
    }, this);
  };
  ProtoBufClient.prototype.keys = function(bucket) {
    return __bind(function(callback) {
      var allKeys;
      allKeys = [];
      return this.pool.send('ListKeysReq', {
        bucket: bucket
      })(function(data) {
        data.keys ? data.keys.forEach(function(key) {
          return allKeys.push(key);
        }) : null;
        return data.done ? callback(allKeys) : null;
      });
    }, this);
  };
  ProtoBufClient.prototype.serverInfo = function() {
    return __bind(function(callback) {
      return this.pool.send('GetServerInfoReq')(function(data) {
        return callback(data);
      });
    }, this);
  };
  ProtoBufClient.prototype.processValueResponse = function(meta, data) {
    var _a, _b, _c, value;
    delete meta.content;
    if ((typeof (_a = data.content) !== "undefined" && _a !== null) && (typeof (_b = data.content[0]) !== "undefined" && _b !== null) && (typeof (_c = data.vclock) !== "undefined" && _c !== null)) {
      value = data.content[0].value;
      delete data.content[0].value;
      meta.load(data.content[0]);
      meta.vclock = data.vclock;
      return meta.decode(value);
    }
  };
  ProtoBufClient.prototype.__defineGetter__('pool', function() {
    return this._pool = this._pool || new Pool(this.options);
  });
  ProtoBufClient.Meta = Meta;
  module.exports = ProtoBufClient;
})();
