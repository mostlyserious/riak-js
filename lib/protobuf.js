(function() {
  var Buffer, Connection, Pool, ProtoBuf, events, fs, net, path, sys;
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
  sys = require('sys');
  net = require('net');
  fs = require('fs');
  events = require('events');
  path = require('path');
  Buffer = require('buffer').Buffer;
  Pool = function(options) {
    this.options = options || {};
    this.options.port = this.options.port || 8087;
    this.options.host = this.options.host || '127.0.0.1';
    this.options.max = this.options.max || 10;
    this.running = 0;
    this.pool = [];
    this.events = new events.EventEmitter();
    return this;
  };
  Pool.prototype.start = function(callback) {
    var _a;
    if (!(typeof (_a = this.running) !== "undefined" && _a !== null)) {
      return false;
    }
    this.next(function(conn) {
      if (conn.writable) {
        if (callback) {
          return callback(conn);
        }
      } else {
        return conn.on('connect', function() {
          if (callback) {
            return callback(conn);
          }
        });
      }
    });
    return true;
  };
  Pool.prototype.send = function(name, data) {
    return __bind(function(callback) {
      return this.start(function(conn) {
        return conn.send(name, data)(function(resp) {
          try {
            return callback(resp);
          } finally {
            conn.finish();
          }
        });
      });
    }, this);
  };
  Pool.prototype.finish = function(conn) {
    var _a;
    if ((typeof (_a = this.running) !== "undefined" && _a !== null)) {
      this.running -= 1;
      this.events.emit('finish');
      if (this.pool.length < this.options.max) {
        return this.pool.push(conn);
      }
    } else {
      return conn.end();
    }
  };
  Pool.prototype.end = function() {
    this.running = null;
    return this.pool.forEach(function(conn) {
      return conn.end();
    });
  };
  Pool.prototype.next = function(callback) {
    var cb;
    return this.running >= this.options.max ? this.events.on('finish', (cb = __bind(function() {
      if (this.running < this.options.max) {
        callback(this.getConnection());
        return this.events.removeListener('finish', cb);
      }
    }, this))) : callback(this.getConnection());
  };
  Pool.prototype.getConnection = function() {
    this.running += 1;
    return this.pool.pop() || new Connection(this);
  };
  Connection = function(pool) {
    this.conn = net.createConnection(pool.options.port, pool.options.host);
    this.pool = pool;
    this.conn.on('data', __bind(function(chunk) {
      var _a, data;
      if ((data = this.receive(chunk))) {
        if (this.callback) {
          this.callback(data);
        }
        return (typeof (_a = pool.running) !== "undefined" && _a !== null) ? this.reset() : this.end();
      }
    }, this));
    this.reset();
    return this;
  };
  Connection.prototype.send = function(name, data) {
    var payload;
    payload = this.prepare(name, data);
    return __bind(function(callback) {
      this.callback = callback;
      return this.conn.write(payload);
    }, this);
  };
  Connection.prototype.finish = function() {
    return this.pool.finish(this);
  };
  Connection.prototype.end = function() {
    return this.conn.end();
  };
  Connection.prototype.on = function(event, listener) {
    this.conn.on(event, listener);
    return this;
  };
  Connection.prototype.prepare = function(name, data) {
    var buf, len, msg, type;
    type = ProtoBuf[name];
    if (data) {
      buf = type.serialize(data);
      len = buf.length + 1;
    } else {
      len = 1;
    }
    msg = new Buffer(len + 4);
    msg[0] = len >>> 24;
    msg[1] = len >>> 16;
    msg[2] = len >>> 8;
    msg[3] = len & 255;
    msg[4] = type.riak_code;
    buf ? buf.copy(msg, 5, 0) : null;
    return msg;
  };
  Connection.prototype.receive = function(chunk, starting) {
    var chunk_len;
    if (this.receiving) {
      chunk_len = chunk.length;
      starting = starting || 0;
      chunk.copy(this.resp, this.read, starting, chunk_len);
      this.read += chunk_len - starting;
      if (this.read === this.length) {
        return this.type.parse(this.resp);
      }
    } else {
      this.length = (chunk[0] << 24) + (chunk[1] << 16) + (chunk[2] << 8) + chunk[3] - 1;
      this.type = ProtoBuf.type(chunk[4]);
      this.resp = new Buffer(this.length);
      return this.receive(chunk, 5);
    }
  };
  Connection.prototype.reset = function() {
    this.type = null;
    this.resp = null;
    this.read = 0;
    return (this.length = 0);
  };
  Connection.prototype.__defineGetter__('receiving', function() {
    return this.resp;
  });
  Connection.prototype.__defineGetter__('writable', function() {
    return this.conn.writable;
  });
  Pool.Connection = Connection;
  ProtoBuf = {
    types: ["ErrorResp", "PingReq", "PingResp", "GetClientIdReq", "GetClientIdResp", "SetClientIdReq", "SetClientIdResp", "GetServerInfoReq", "GetServerInfoResp", "GetReq", "GetResp", "PutReq", "PutResp", "DelReq", "DelResp", "ListBucketsReq", "ListBucketsResp", "ListKeysReq", "ListKeysResp", "GetBucketReq", "GetBucketResp", "SetBucketReq", "SetBucketResp", "MapRedReq", "MapRedResp"],
    type: function(num) {
      return this[this.types[num]];
    },
    schemaFile: path.join(path.dirname(module.filename), 'riak.desc')
  };
  ProtoBuf.__defineGetter__('schema', function() {
    return this._schema = this._schema || new (require('protobuf_for_node').Schema)(fs.readFileSync(ProtoBuf.schemaFile));
  });
  ProtoBuf.types.forEach(function(name) {
    var cached_name;
    cached_name = ("_" + name);
    return ProtoBuf.__defineGetter__(name, function() {
      var code, sch;
      if (this[cached_name]) {
        return this[cached_name];
      } else {
        code = ProtoBuf.types.indexOf(name);
        if ((sch = ProtoBuf.schema[("Rpb" + name)])) {
          sch.riak_code = code;
          return (this[cached_name] = sch);
        } else {
          return (this[cached_name] = {
            riak_code: code,
            parse: function() {
              return true;
            }
          });
        }
      }
    });
  });
  module.exports = Pool;
})();
