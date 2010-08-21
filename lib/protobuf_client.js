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
    contentEncoding: this.contentEncoding,
    usermeta: this.parseUsermeta(this.usermeta)
  };
  delete this.usermeta;
  delete this.links;
  return this;
};
Meta.prototype.parseUsermeta = function(data) {
  var _a, key, parsed, value;
  parsed = [];
  _a = data;
  for (key in _a) {
    value = _a[key];
    parsed.push({
      key: key,
      value: value
    });
  }
  return parsed;
};
ProtoBufClient = function() {
  return Client.apply(this, arguments);
};
__extends(ProtoBufClient, Client);
ProtoBufClient.prototype.get = function(bucket, key, options) {
  return __bind(function(callback) {
    var meta;
    meta = new Meta(bucket, key, options);
    return this.send("GetReq", meta)(__bind(function(data) {
      return callback(this.processValueResponse(meta, data), meta);
    }, this));
  }, this);
};
ProtoBufClient.prototype.save = function(bucket, key, body, options) {
  return __bind(function(callback) {
    var meta;
    meta = new Meta(bucket, key, options);
    return this.send("PutReq", meta.withContent(body))(__bind(function(data) {
      return callback(this.processValueResponse(meta, data), meta);
    }, this));
  }, this);
};
ProtoBufClient.prototype.remove = function(bucket, key, options) {
  return __bind(function(callback) {
    var meta;
    meta = new Meta(bucket, key, options);
    return this.send("DelReq", meta)(callback);
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
    return this.send('PingReq')(callback);
  }, this);
};
ProtoBufClient.prototype.end = function() {
  if (this.connection) {
    return this.connection.end();
  }
};
ProtoBufClient.prototype.buckets = function() {
  return __bind(function(callback) {
    return this.send('ListBucketsReq')(function(data) {
      return callback(data.buckets);
    });
  }, this);
};
ProtoBufClient.prototype.keys = function(bucket) {
  return __bind(function(callback) {
    var keys;
    keys = [];
    return this.send('ListKeysReq', {
      bucket: bucket
    })(__bind(function(data) {
      return this.processKeysResponse(data, keys, callback);
    }, this));
  }, this);
};
ProtoBufClient.prototype.serverInfo = function() {
  return __bind(function(callback) {
    return this.send('GetServerInfoReq')(callback);
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
    return this.send("MapRedReq", body)(__bind(function(data) {
      return this.processMapReduceResponse(data, resp, callback);
    }, this));
  }, this);
};
ProtoBufClient.prototype.send = function(name, data) {
  var _a;
  return (typeof (_a = this.connection) !== "undefined" && _a !== null) && this.connection.writable ? this.connection.send(name, data) : __bind(function(callback) {
    return this.pool.start(__bind(function(conn) {
      this.connection = conn;
      return this.connection.send(name, data)(callback);
    }, this));
  }, this);
};
ProtoBufClient.prototype.processKeysResponse = function(data, keys, callback) {
  if (data.errcode) {
    callback(data);
  }
  if (data.keys) {
    data.keys.forEach(function(key) {
      return keys.push(key);
    });
  }
  return data.done ? callback(keys) : null;
};
ProtoBufClient.prototype.processMapReduceResponse = function(data, resp, callback) {
  var _a, _b, parsed;
  if (data.errcode) {
    callback(data);
  }
  if (typeof (_b = data.phase) !== "undefined" && _b !== null) {
    if (resp.phases.indexOf(data.phase) === -1) {
      resp.phases.push(data.phase);
    }
    parsed = JSON.parse(data.response);
    if (typeof (_a = resp[data.phase]) !== "undefined" && _a !== null) {
      parsed.forEach(function(item) {
        return resp[data.phase].push(item);
      });
    } else {
      resp[data.phase] = parsed;
    }
  }
  return data.done ? callback(resp) : null;
};
ProtoBufClient.prototype.processValueResponse = function(meta, data) {
  var _a, _b, _c, _d, content, value;
  delete meta.content;
  if ((typeof (_b = data.content) !== "undefined" && _b !== null) && (typeof (_c = data.content[0]) !== "undefined" && _c !== null) && (typeof (_d = data.vclock) !== "undefined" && _d !== null)) {
    _a = this.processValue(data.content[0]);
    content = _a[0];
    value = _a[1];
    meta.load(content);
    meta.vclock = data.vclock;
    return meta.decode(value);
  }
};
ProtoBufClient.prototype.processValue = function(content) {
  var _a, value;
  value = content.value;
  if (typeof (_a = content.usermeta == null ? undefined : content.usermeta.forEach) !== "undefined" && _a !== null) {
    content.usermeta.forEach(function(pair) {
      return (content[pair.key] = pair.value);
    });
  }
  delete content.value;
  delete content.usermeta;
  return [content, value];
};
ProtoBufClient.Meta = Meta;
module.exports = ProtoBufClient;