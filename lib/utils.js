(function() {
  module.exports = {
    isArray: function(obj) {
      return !!(obj && obj.concat && obj.unshift && !obj.callee);
    },
    toJSON: function(data) {
      return JSON.stringify(data, function(key, val) {
        return typeof val === 'function' ? val.toString() : val;
      });
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
