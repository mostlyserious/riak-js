(function() {
  var __hasProp = Object.prototype.hasOwnProperty;
  module.exports = {
    path: function(bucket, key) {
      return "" + (bucket) + "/" + (key ? key : '');
    },
    isArray: function(obj) {
      return !!(obj && obj.concat && obj.unshift && !obj.callee);
    },
    toJSON: function(data) {
      return JSON.stringify(data, function(key, val) {
        return typeof val === 'function' ? val.toString() : val;
      });
    },
    toQuery: function(query, riak) {
      var _a, _b, k;
      _b = query;
      for (k in _b) {
        if (!__hasProp.call(_b, k)) continue;
        _a = _b[k];
        if (typeof query[k] === 'boolean') {
          query[k] = String(query[k]);
        }
      }
      return riak.stringifyQuery(query);
    },
    makePhases: function(type, phase, args) {
      if (!this.isArray(phase)) {
        phase = [phase];
      }
      return phase.map(function(p) {
        var _a, temp;
        temp = {};
        if (p) {
          temp[type] = (function() {
            if ((_a = typeof p) === 'function') {
              return {
                source: p.toString(),
                arg: args
              };
            } else if (_a === 'string') {
              return {
                name: p,
                arg: args
              };
            } else if (_a === 'object') {
              return p;
            }
          })();
          return temp;
        }
      });
    },
    stringToLinks: function(links) {
      var result;
      result = [];
      links ? links.split(',').forEach(function(link) {
        var _a, _b, i, r;
        r = link.trim().match(/^<\/(.*)\/(.*)\/(.*)>;\sriaktag="(.*)"$/);
        _b = r;
        for (i in _b) {
          if (!__hasProp.call(_b, i)) continue;
          _a = _b[i];
          if (r) {
            r[i] = decodeURIComponent(r[i]);
          }
        }
        if (r) {
          return result.push({
            bucket: r[2],
            key: r[3],
            tag: r[4]
          });
        }
      }) : null;
      return result;
    },
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
  };
})();
