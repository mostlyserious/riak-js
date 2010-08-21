var Client, CoreMeta, Mapper, Meta, Pool, ProtoBufClient;
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
Mapper = require('./mapper');
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
ProtoBufClient.prototype.map = function(phase, args) {
  return new Mapper(this, 'map', phase, args);
};
ProtoBufClient.prototype.reduce = function(phase, args) {
  return new Mapper(this, 'reduce', phase, args);
};
ProtoBufClient.prototype.link = function(phase) {
  return new Mapper(this, 'link', phase);
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
    var keys;
    keys = [];
    return this.pool.send('ListKeysReq', {
      bucket: bucket
    })(__bind(function(data) {
      return this.processKeysResponse(data, keys, callback);
    }, this));
  }, this);
};
ProtoBufClient.prototype.serverInfo = function() {
  return __bind(function(callback) {
    return this.pool.send('GetServerInfoReq')(function(data) {
      return callback(data);
    });
  }, this);
};
ProtoBufClient.prototype.runJob = function(job) {
  return __bind(function(callback) {
    var body, resp;
    body = {
      request: JSON.stringify(job.data),
      contentType: 'application/json'
    };
    resp = {
      phases: []
    };
    return this.pool.send("MapRedReq", body)(__bind(function(data) {
      return this.processMapReduceResponse(data, resp, callback);
    }, this));
  }, this);
};
ProtoBufClient.prototype.processKeysResponse = function(data, keys, callback) {
  data.errcode ? callback(data) : null;
  data.keys ? data.keys.forEach(function(key) {
    return keys.push(key);
  }) : null;
  return data.done ? callback(keys) : null;
};
ProtoBufClient.prototype.processMapReduceResponse = function(data, resp, callback) {
  var _a, _b, parsed;
  data.errcode ? callback(data) : null;
  if ((typeof (_b = data.phase) !== "undefined" && _b !== null)) {
    if (resp.phases.indexOf(data.phase) === -1) {
      resp.phases.push(data.phase);
    }
    parsed = JSON.parse(data.response);
    (typeof (_a = resp[data.phase]) !== "undefined" && _a !== null) ? parsed.forEach(function(item) {
      return resp[data.phase].push(item);
    }) : (resp[data.phase] = parsed);
  }
  return data.done ? callback(resp) : null;
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