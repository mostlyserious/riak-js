/**
 * Module dependencies
 */
var utils = require('./utils'),
  Meta = require('./meta'),
  Mapper = require('./mapper');

/**
 * Constructor
 * @api private
 */
function Riak(options) {
  this.defaults = utils.mixin({}, this.defaults, options);
  this.client = Riak.prototype.getClient(this.defaults.port || 8098, this.defaults.host || 'localhost', this.defaults);
  delete this.defaults.host;
  delete this.defaults.port;
}

/**
 * Client defaults
 */
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

/**
 * Fetches a value by key
 *
 * @param {String} bucket
 * @param {String} key
 * @param {Object} options - overrides default options and specifies particular options for this operation
 * @return {Function} A function that takes a callback as its only input
 * @api public
 */
Riak.prototype.get = function(bucket, key, options) {
  options = utils.ensure(options);
  options.key = key;
  return this.execute(utils.path(bucket, key), options);
}

/**
 * Fetches all values in a bucket
 *
 *  - options
 *    - `where`: filters by property (`db.getAll('users', {where: {city: "Paris", age: 23}})`), works on Riak 0.12+
 *    - `withId`: returns values with its 
 * 
 * The first argument passed to the callback is an Array holding the results, or an Array holding [key, value]s
 *
 * @param {String} bucket
 * @param {Object} options - overrides default options and specifies particular options for this operation
 * @return {Function} A function that takes a callback as its only input
 * @api public
 */
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

/**
 * Fetches the key count for a bucket
 *
 * @param {String} bucket
 * @param {Object} options - overrides default options and specifies particular options for this operation
 * @return {Function} A function that takes a callback as its only input
 * @api public
 */
Riak.prototype.count = function(bucket, options) {
  options = utils.ensure(options);
  return this.map('Riak.mapValues').reduce(function(v) { return [v.length] }).run(bucket)
}

/**
 * Fetches only the key's value metadata
 *
 * @param {String} bucket
 * @param {String} key
 * @param {Object} options - overrides default options and specifies particular options for this operation
 * @return {Function} A function that takes a callback as its only input
 * @api public
 */
Riak.prototype.head = function(bucket, key, options) {
  options = utils.ensure(options);
  options.method = 'HEAD';
  options.key = key;
  return this.execute(utils.path(bucket, key), options);
}

/**
 * Removes a value
 *
 * @param {String} bucket
 * @param {String} key
 * @param {Object} options - overrides default options and specifies particular options for this operation
 * @return {Function} A function that takes a callback as its only input
 * @api public
 */
Riak.prototype.remove = function(bucket, key, options) {
  options = utils.ensure(options);
  options.method = 'DELETE';
  options.key = key;
  return this.execute(utils.path(bucket, key), options);
}

/**
 * Removes all values from a bucket
 *
 * _IMPORTANT_: This issues *several* requests
 *
 * @param {String} bucket
 * @param {Object} options - overrides default options and specifies particular options for this operation
 * @return {Function} A function that takes a callback as its only input
 * @api public
 */
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

/**
 * Saves a value
 *
 * @param {String} bucket
 * @param {String} key
 * @param {Object} data - the value to be stored
 * @param {Object} options - overrides default options and specifies particular options for this operation
 * @return {Function} A function that takes a callback as its only input
 * @api public
 */
Riak.prototype.save = function(bucket, key, data, options) {
  data = utils.ensure(data);
  options = utils.ensure(options);
  if (!options.method)
    options.method = key ? 'PUT' : 'POST';
  options.data = data;
  options.key = key;

  return this.execute(utils.path(bucket, key), options);
}

/**
 * Link-walks from a given bucket/key
 *
 * This implementation uses Map/Reduce
 *
 * @param {String} bucket from where to start the link-walk
 * @param {String} key from where to start the link-walk
 * @param {Array} spec - a link-walking spec, such as `[["bucket", "tag"]]`
 * @param {Object} options - overrides default options and specifies particular options for this operation
 * @return {Function} A function that takes a callback as its only input
 * @api public
 */
Riak.prototype.walk = function(bucket, key, spec, options) {
  var linkPhases = spec.map(function(unit) {
    return { bucket: unit[0] || '_', tag: unit[1] || '_', keep: unit[2] ? true : false }
  });
    
  return this
    .link(linkPhases)
    .reduce({ language: 'erlang', module: 'riak_kv_mapreduce',
      'function': 'reduce_set_union'})
    .map("Riak.mapValuesJson")
    .run(key ? [[bucket, key]] : bucket, options);
}

/**
 * Pings the node this client is currently connected to
 *
 * @return {Function} A function that takes a callback as its only input
 * @api public
 */
Riak.prototype.ping = function() {
  return this.head('', '', {interface: 'ping'})
}

/**
 * Handy method to check whether the response was an error or not
 *
 *  Usage: `if (db.error(response)) { ... }`
 *
 * @return {Boolean} true if it's an Error
 * @api public
 */
Riak.prototype.error = function(response) {
  return response instanceof Error
}


/**
 * Convenience method to help construct a `Mapper` object to achieve a chainable Map/Reduce-API,
 * initializing it with one or more *map* phases
 *
 * @return {Mapper}
 * @api public
 */
Riak.prototype.map = function(phase, args) {
  return new Mapper(utils.makePhases("map", phase, args), this)
}

/**
 * Convenience method to help construct a `Mapper` object to achieve a chainable Map/Reduce-API,
 * initializing it with one or more *reduce* phases
 *
 * @return {Mapper}
 * @api public
 */
Riak.prototype.reduce = function(phase, args) {
  return new Mapper(utils.makePhases("reduce", phase, args), this)
}

/**
 * Convenience method to help construct a `Mapper` object to achieve a chainable Map/Reduce-API,
 * initializing it with one or more *link* phases
 *
 * @return {Mapper}
 * @api public
 */

Riak.prototype.link = function(phase) {
  return new Mapper(utils.makePhases("link", phase), this)
}

/**
 * @api private
 */
Riak.prototype.execute = function (url, options) {

  var self = this;
  options = utils.mixin(true, {}, this.defaults, options);

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
    
    if (options.headers['content-type'] === 'application/json') {
      options.data = utils.toJSON(options.data)
    }
    
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