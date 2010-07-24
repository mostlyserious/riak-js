var utils = require('./utils'),
  Meta = require('./meta'),
  Mapper = require('./mapper')

var Riak = function (settings) {
  this.defaults = utils.mixin({}, this.defaults, settings);
  this.client = Riak.prototype.getClient(this.defaults.port || 8098, this.defaults.host || 'localhost', this.defaults);
  delete this.defaults.host;
  delete this.defaults.port;
}

Riak.prototype.defaults = {
  clientId: 'riak-js', 
  method: 'GET',
  interface: 'riak',
  headers: { 'content-type': 'application/json', 'Host': "" },
  debug: true,
  callback: function(response, meta) {
    if (response)
      Riak.prototype.log(meta.type === 'application/json' ? JSON.stringify(response) : response)
  }
}

// db operations

Riak.prototype.get = function(bucket, key, options) {
  options = utils.ensure(options);
  options.key = key;
  return this.execute(utils.path(bucket, key), options);
}

Riak.prototype.getAll = function(bucket, options) {
  options = utils.ensure(options);
  if (options.where) {
    return this.map('Riak.mapByFields', options.where).run(bucket)
  }
  if (options.withId) {
    return this.map(function(v) { return [[v.key, v.values[0].data]] }).run(bucket)
  }
  return this.map('Riak.mapValues').run(bucket)
}

Riak.prototype.count = function(bucket, options) {
  options = utils.ensure(options);
  return this.map('Riak.mapValues').reduce(function(v) { return [v.length] }).run(bucket)
}

Riak.prototype.head = function(bucket, key, options) {
  options = utils.ensure(options);
  options.method = 'HEAD';
  options.key = key;
  return this.execute(utils.path(bucket, key), options);
}

Riak.prototype.remove = function(bucket, key, options) {
  options = utils.ensure(options);
  options.method = 'DELETE';
  options.key = key;
  return this.execute(utils.path(bucket, key), options);
}

Riak.prototype.removeAll = function(bucket, options) {
  options = utils.ensure(options),
    self = this;
  options.keys = true;
  return function(callback) {
    callback = callback || options.callback;

    self.get(bucket, undefined, options)(function(response) {
      response.keys.forEach(function(key) {
        self.remove(bucket, key, options)(callback);
      })
    })    
  }
}

Riak.prototype.save = function(bucket, key, data, options) {
  data = utils.ensure(data);
  options = utils.ensure(options);
  if (!options.method)
    options.method = key ? 'PUT' : 'POST';
  options.data = data;
  options.key = key;

  return this.execute(utils.path(bucket, key), options);
}

Riak.prototype.walk = function(bucket, key, spec, options) {
  var linkPhases = spec.map(function(unit) {
    return { bucket: unit[0] || "_", tag: unit[1] || "_", keep: unit[2] ? true : false }
  });
    
  return this
    .link(linkPhases)
    .reduce({ language: "erlang", module: "riak_kv_mapreduce", "function": "reduce_set_union"})
    .map("Riak.mapValuesJson")
    .run(key ? [[bucket, key]] : bucket, options);
}

// misc

Riak.prototype.ping = function() {
  return this.head('', '', {interface: 'ping'})
}

Riak.prototype.error = function(response) {
  return response instanceof Error
}

// map/reduce api

Riak.prototype.map = function(phase, args) {
  return new Mapper(utils.makePhases("map", phase, args), this)
}

Riak.prototype.reduce = function(phase, args) {
  return new Mapper(utils.makePhases("reduce", phase, args), this)
}

Riak.prototype.link = function(phase) {
  return new Mapper(utils.makePhases("link", phase), this)
}

Riak.prototype.execute = function (url, options) {

  var self = this;
  options = utils.mixin({}, this.defaults, options);

  return function(callback) {

    callback = callback || options.callback;
    
    // set cache-related headers
    if (options.headers['X-Riak-Vclock']) { options.headers['X-Riak-ClientId'] = options.clientId }
    if (options.etag) { options.headers['If-None-Match'] = options.etag }
    if (options.lastModified) { options.headers['If-Modified-Since'] = options.lastModified }
    
    // handle links, merging those set in the header with those set via the shortcut
    if (utils.isArray(options.links)) {
      var hl = options.headers.link ? ", " + options.headers.link : ""
      options.headers.link = new Meta({}, self.defaults.interface).makeLinks(options.links) + hl;
    }
    
    // handle content-type
    var setContentType = function(type, binary) {
      if (binary) options.requestEncoding = 'binary';
      options.headers['content-type'] = type;
    }
    
    switch(options.type) {
      case undefined:
      case 'json': setContentType('application/json'); break;
      case 'xml': setContentType('text/xml'); break;
      case 'text': setContentType('text/plain'); break;
      case 'jpeg': setContentType('image/jpeg', true); break;
      case 'gif': setContentType('image/gif', true); break;
      case 'png': setContentType('image/png', true); break;
      case 'binary': setContentType('application/octet-stream', true); break;
      default: setContentType(options.type); break;
    }
    
    if (options.headers['content-type'] === 'application/json') options.data = utils.toJSON(options.data)
    
    var queryProperties = {};

    // known url params are added to the query
    ['r', 'w', 'dw', 'keys', 'props', 'vtag', 'nocache', 'returnbody'].forEach(function(p) {
      if (options[p] !== undefined) {
       queryProperties[p] = options[p];
      }
    });

    var query = utils.toQuery(queryProperties, self);

    var path = '/' + options.interface + '/' + url + (query ? ('?' + query) : '');

    self.log(options.method.toUpperCase() + ' ' + path);

    // actual http calls provided by implementors
    Riak.prototype.executeInternal(self, path, options, callback);

  }
}

// exports

module.exports = Riak