// This file is provided to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file
// except in compliance with the License.  You may obtain
// a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

var Riak = function (settings) {
  this.defaults = Riak.prototype.mixin({}, this.defaults, settings);
  this.client = Riak.prototype.getClient(this.defaults.port || 8098, this.defaults.host || 'localhost', this.defaults);
  delete this.defaults.host;
  delete this.defaults.port;
}

Riak.prototype.defaults = {	
  // clientId needs to be bound to the user/machine (even in the browser), but how?
  clientId: 'riak-js', 
  method: 'GET',
  interface: 'riak',
  headers: {},
  debug: true,
  callback: function(response, meta) {
    if (response)
      Riak.prototype.log(meta.headers['content-type'] === 'application/json' ? JSON.stringify(response) : response)
  },
  errback: function(response, meta) {
    if (response)
      Riak.prototype.log((meta ? meta.statusCode + ": " : "") + response, 'error')
  }
}

// db operations

Riak.prototype.get = function(bucket, key, options) {
  options = this.ensure(options);
  options.key = key;
  return this.execute(this.path(bucket, key), options);
}

Riak.prototype.head = function(bucket, key, options) {
  options = this.ensure(options);
  options.method = 'HEAD';
  options.key = key;
  return this.execute(this.path(bucket, key), options);
}

Riak.prototype.remove = function(bucket, key, options) {
  options = this.ensure(options);
  options.method = 'DELETE';
  options.key = key;
  return this.execute(this.path(bucket, key), options);
}

Riak.prototype.removeAll = function(bucket, options) {
  options = this.ensure(options),
    self = this;
  options.keys = true;
  return function(callback, errback) {
    callback = callback || options.callback;
    errback = errback || options.errback;

    self.get(bucket, undefined, options)(function(response) {
      response.keys.forEach(function(key) {
        self.remove(bucket, key, options)(callback, errback);
      })
    }, errback)    
  }
}

Riak.prototype.save = function(bucket, key, data, options) {
  data = this.ensure(data);
  options = this.ensure(options);
  if (!options.method)
    options.method = key ? 'PUT' : 'POST';
  options.data = data;
  options.key = key;

  return this.execute(this.path(bucket, key), options);
}

Riak.prototype.walk = function(bucket, key, spec, options) {
  var linkPhases = spec.map(function(unit) {
    return { bucket: unit[0] || "_", tag: unit[1] || "_", keep: unit[2] ? true : false }
  }),
    reducePhase = { language :"erlang", module: "riak_kv_mapreduce", "function" :"reduce_set_union"},
    mapPhase = { name: "Riak.mapValuesJson"};
    
  return this
      .link(linkPhases)
      .reduce(reducePhase)
      .map(mapPhase)
      .run([[bucket, key]], options);
  
}

// map/reduce api

function isArray(o) {   
  return o && !(o.propertyIsEnumerable('length')) && typeof o === 'object' && typeof o.length === 'number';
}

function makePhases(type, phase) {
  
  if (!isArray(phase)) phase = [phase]
  
  return phase.map(function(p) {
    var temp = {}
    temp[type] = p
    return temp
  })
}

Riak.prototype.map = function(phase) {
  return new Mapper(makePhases("map", phase), this)
}

Riak.prototype.reduce = function(phase) {
  return new Mapper(makePhases("reduce", phase), this)
}

Riak.prototype.link = function(phase) {
  return new Mapper(makePhases("link", phase), this)
}

function Mapper(phases, riak) {
  this.phases = phases;
  this.riak = riak;
  var self = this;
  this.addPhases = function(phases) {
    phases.forEach(function(phase) { self.phases.push(phase) })
  }
}

Mapper.prototype.map = function(phase) {
  this.addPhases(makePhases("map", phase))
  return this;
}

Mapper.prototype.reduce = function(phase) {
  this.addPhases(makePhases("reduce", phase))
  return this;
}

Mapper.prototype.link = function(phase) {
  this.addPhases(makePhases("link", phase))
  return this;
}

Mapper.prototype.run = function(inputs, options) {
  options = this.riak.ensure(options);
  options.interface = 'mapred';
  options.method = 'POST';
  options.headers = { 'content-type': 'application/json' };

  this.phases.forEach(function(phase) {
    for (p in phase) { // map, reduce or link
      if (phase[p].language === undefined) {
        phase[p].language = 'javascript';
      };
    }
  })
  
  options.data = {
    inputs: inputs,
    query: this.phases
  }

  return this.riak.execute('', options);
}

Riak.prototype.execute = function (url, options) {

  var self = this;
  options = Riak.prototype.mixin({}, this.defaults, options);

  return function(callback, errback) {

    callback = callback || options.callback;
    errback = errback || options.errback;
    
    // set headers
    if (options.headers['X-Riak-Vclock']) { options.headers['X-Riak-ClientId'] = options.clientId }
    if (options.etag) { options.headers['If-None-Match'] = options.etag }
    if (options.lastModified) { options.headers['If-Modified-Since'] = options.lastModified }

    if (options.headers['content-type'] === undefined && options.headers['Content-Type'] === undefined) {
      options.headers['content-type'] = 'application/json';
    }

    if (options.headers['content-type'] === 'application/json') {
      try {
        options.data = self.toJSON(options.data);
      } catch (e) {} // no-op if error
    }

    var queryProperties = {};

    // known url params are added to the query
    ['r', 'w', 'dw', 'keys', 'props', 'vtag', 'nocache', 'returnbody'].forEach(function(p) {
      if (options[p] !== undefined) {
       queryProperties[p] = options[p];
      }
    });

    var query = self.toQuery(queryProperties);

    var path = '/' + options.interface + '/' + url + (query ? ('?' + query) : '');

    self.log(options.method.toUpperCase() + ' ' + path);

    Riak.prototype.executeInternal(self, path, options, callback, errback);

  }
}

// utils

Riak.prototype.path = function(bucket, key) {
  return bucket + '/' + (key ? key : '');
}

Riak.prototype.makeLinks = function(links) {
  var i = this.defaults.interface;
  return links.map(function(link) {
    link.tag = link.tag || "_";
    return '</' + i + '/' + link.bucket + '/' + link.key + '>; riaktag="' + link.tag + '"';
  }).join(", ");
}

Riak.prototype.toQuery = function(query) {
  // use boolean strings since riak expects those
  for (var k in query) {
    if (typeof query[k] == 'boolean') {
      query[k] = String(query[k]);
    }
  }
  return this.stringifyQuery(query);
}

Riak.prototype.toJSON = function(data) {
  return JSON.stringify(data, function(key, val) {
    if (typeof val == 'function') {
      return val.toString();
    }
    return val;
  });
}

Riak.prototype.ensure = function(obj) {
  return obj || {};
}

// From jQuery.extend in the jQuery JavaScript Library v1.3.2
// Copyright (c) 2009 John Resig
// Dual licensed under the MIT and GPL licenses.
// http://docs.jquery.com/License
// Modified for node.js (formely for copying properties correctly)
Riak.prototype.mixin = function() {
  // copy reference to target object
  var target = arguments[0] || {}, i = 1, length = arguments.length, deep = false, source;

  // Handle a deep copy situation
  if ( typeof target === "boolean" ) {
    deep = target;
    target = arguments[1] || {};
    // skip the boolean and the target
    i = 2;
  }

  // Handle case when target is a string or something (possible in deep copy)
  if ( typeof target !== "object" && !(typeof target === 'function') )
    target = {};

  for ( ; i < length; i++ ) {
    // Only deal with non-null/undefined values
    if ( (source = arguments[i]) != null ) {
      // Extend the base object
      Object.getOwnPropertyNames(source).forEach(function(k){
        var d = Object.getOwnPropertyDescriptor(source, k) || {value: source[k]};
        if (d.get) {
          target.__defineGetter__(k, d.get);
          if (d.set) {
            target.__defineSetter__(k, d.set);
          }
        }
        else {
          // Prevent never-ending loop
          if (target !== d.value) {

              if (deep && d.value && typeof d.value === "object") {
                target[k] = exports.mixin(deep,
                  // Never move original objects, clone them
                  target[k] || (d.value.length != null ? [] : {})
                , d.value);
              }
              else {
                target[k] = d.value;
              }
          }
        }
      });
    }
  }
  // Return the modified object
  return target;
};

// exports

if (typeof exports === 'object') {
 exports.common = Riak;
}
