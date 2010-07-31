var utils = module.exports = {
  
  path: function(bucket, key) {
    return bucket + '/' + (key ? key : '');
  },
  
  toQuery: function(query, riak) {
    // use boolean strings since riak expects those
    for (var k in query) {
      if (typeof query[k] == 'boolean') {
        query[k] = String(query[k]);
      }
    }
    return riak.stringifyQuery(query);
  },
  
  toJSON: function(data) {
    return JSON.stringify(data, function(key, val) {
      if (typeof val == 'function') {
        return val.toString();
      }
      return val;
    });
  },
  
  ensure: function(obj) {
    return obj || {};
  },
  
  isArray: function(o) {   
    return o && !(o.propertyIsEnumerable('length')) && typeof o === 'object' && typeof o.length === 'number';
  },
  
  // it always returns an array of phases, even an array of 1 phase
  makePhases: function(type, phase, args) {

    if (!this.isArray(phase)) {
      phase = [phase]
    }

    return phase.map(function(p) {
      var temp = {};
      switch (typeof p) {
        case 'function': temp[type] = {source: p.toString(), arg: args}; break;
        case 'string': temp[type] = {name: p, arg: args}; break;
        case 'object': temp[type] = p; break;
        default: 
      }
      return temp
    })
  },
  
  stringToLinks: function(links) {
    var result = [];
    if (links) {
      links.split(',').forEach(function(link) {
        var r = link.trim().match(/^<\/(.*)\/(.*)\/(.*)>;\sriaktag="(.*)"$/)
        if (r) {
          result.push({bucket: decodeURIComponent(r[2]), key: decodeURIComponent(r[3]), tag: decodeURIComponent(r[4])})
        }
      })
    }
    return result;
  },
  
  // From jQuery.extend in the jQuery JavaScript Library v1.3.2
  // Copyright (c) 2009 John Resig
  // Dual licensed under the MIT and GPL licenses.
  // http://docs.jquery.com/License
  // Modified for node.js (formely for copying properties correctly)
  mixin: function() {
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
                  target[k] = module.exports.mixin(deep,
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
  }
  
}