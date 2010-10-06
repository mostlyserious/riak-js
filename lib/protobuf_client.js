var Client, Mapper, Meta, Pool, ProtoBufClient;
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
Pool = require('./protobuf');
Meta = require('./protobuf_meta');
Mapper = require('./mapper');
ProtoBufClient = function() {
  return Client.apply(this, arguments);
};
__extends(ProtoBufClient, Client);
ProtoBufClient.prototype.get = function(bucket, key) {
  var _ref, callback, meta, options;
  options = __slice.call(arguments, 2);
  _ref = this.ensure(options);
  options = _ref[0];
  callback = _ref[1];
  meta = new Meta(bucket, key, options);
  return this.send("GetReq", meta)(__bind(function(data) {
    return this.executeCallback(this.processValueResponse(meta, data), meta, callback);
  }, this));
};
ProtoBufClient.prototype.save = function(bucket, key, body) {
  var _ref, callback, meta, options;
  options = __slice.call(arguments, 3);
  _ref = this.ensure(options);
  options = _ref[0];
  callback = _ref[1];
  meta = new Meta(bucket, key, options);
  return this.send("PutReq", meta.withContent(body))(__bind(function(data) {
    return this.executeCallback(this.processValueResponse(meta, data), meta, callback);
  }, this));
};
ProtoBufClient.prototype.remove = function(bucket, key) {
  var _ref, callback, meta, options;
  options = __slice.call(arguments, 2);
  _ref = this.ensure(options);
  options = _ref[0];
  callback = _ref[1];
  meta = new Meta(bucket, key, options);
  return this.send("DelReq", meta)(__bind(function(data, meta) {
    return this.executeCallback(data, meta, callback);
  }, this));
};
ProtoBufClient.prototype.add = function(inputs) {
  return new Mapper(this, inputs);
};
ProtoBufClient.prototype.ping = function(callback) {
  return this.send('PingReq')(__bind(function(data, meta) {
    return this.executeCallback(data, meta, callback);
  }, this));
};
ProtoBufClient.prototype.end = function() {
  if (this.connection) {
    return this.connection.end();
  }
};
ProtoBufClient.prototype.buckets = function(callback) {
  return this.send('ListBucketsReq')(__bind(function(data, meta) {
    return this.executeCallback(data.buckets, meta, callback);
  }, this));
};
ProtoBufClient.prototype.keys = function(bucket, callback) {
  var keys;
  keys = [];
  return this.send('ListKeysReq', {
    bucket: bucket
  })(__bind(function(data, meta) {
    return this.processKeysResponse(data, keys, meta, callback);
  }, this));
};
ProtoBufClient.prototype.serverInfo = function(callback) {
  return this.send('GetServerInfoReq')(__bind(function(data, meta) {
    return this.executeCallback(data, meta, callback);
  }, this));
};
ProtoBufClient.prototype.runJob = function(job, callback) {
  var body, resp;
  body = {
    request: JSON.stringify(job.data),
    contentType: 'application/json'
  };
  resp = {
    phases: []
  };
  return this.send("MapRedReq", body)(__bind(function(data, meta) {
    return this.processMapReduceResponse(data, resp, meta, callback);
  }, this));
};
ProtoBufClient.prototype.send = function(name, data) {
  var _ref;
  return (typeof (_ref = this.connection) !== "undefined" && _ref !== null) && this.connection.writable ? this.connection.send(name, data) : __bind(function(callback) {
    return this.pool.start(__bind(function(conn) {
      this.connection = conn;
      return this.connection.send(name, data)(callback);
    }, this));
  }, this);
};
ProtoBufClient.prototype.processKeysResponse = function(data, keys, meta, callback) {
  if (data.errcode) {
    this.executeCallback(data, meta, callback);
  }
  if (data.keys) {
    data.keys.forEach(function(key) {
      return keys.push(key);
    });
  }
  return data.done ? this.executeCallback(keys, meta, callback) : null;
};
ProtoBufClient.prototype.processMapReduceResponse = function(data, resp, meta, callback) {
  var _ref, parsed;
  if (data.errcode) {
    this.executeCallback(data, meta, callback);
  }
  if (typeof (_ref = data.phase) !== "undefined" && _ref !== null) {
    if (resp.phases.indexOf(data.phase) === -1) {
      resp.phases.push(data.phase);
    }
    parsed = JSON.parse(data.response);
    if (typeof (_ref = resp[data.phase]) !== "undefined" && _ref !== null) {
      parsed.forEach(function(item) {
        return resp[data.phase].push(item);
      });
    } else {
      resp[data.phase] = parsed;
    }
  }
  return data.done ? this.executeCallback(resp, meta, callback) : null;
};
ProtoBufClient.prototype.processValueResponse = function(meta, data) {
  var _ref, content, value;
  delete meta.content;
  if ((typeof (_ref = data.content) !== "undefined" && _ref !== null) && (typeof (_ref = data.content[0]) !== "undefined" && _ref !== null) && (typeof (_ref = data.vclock) !== "undefined" && _ref !== null)) {
    _ref = this.processValue(data.content[0]);
    content = _ref[0];
    value = _ref[1];
    meta.load(content);
    meta.vclock = data.vclock;
    return meta.decode(value);
  }
};
ProtoBufClient.prototype.processValue = function(content) {
  var _ref, value;
  value = content.value;
  if (typeof (_ref = content.usermeta == null ? undefined : content.usermeta.forEach) !== "undefined" && _ref !== null) {
    content.usermeta.forEach(function(pair) {
      return (content[pair.key] = pair.value);
    });
  }
  delete content.value;
  delete content.usermeta;
  return [content, value];
};
ProtoBufClient.prototype.metaClass = Meta;
module.exports = ProtoBufClient;