module.exports = {
  toJSON: function(data) {
    return JSON.stringify(data, function(key, val) {
      return typeof val === 'function' ? val.toString() : val;
    });
  },
  parseMultipart: function(data, boundary) {
    var _ref, _ref2, escape;
    escape = function(text) {
      return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    };
    data = ((typeof (_ref2 = ((_ref = data.split(new RegExp("\r?\n--" + (escape(boundary)) + "--\r?\n"))))) === "undefined" || _ref2 === null) ? undefined : _ref2[0]) || "";
    return data.split(new RegExp("\r?\n--" + (escape(boundary)) + "\r?\n")).filter(function(e) {
      return !!e;
    }).map(function(part) {
      var _ref3, body, headers, hs, md;
      if (md = part.split(/\r?\n\r?\n/)) {
        _ref3 = md;
        headers = _ref3[0];
        body = _ref3[1];
        hs = {};
        headers.split(/\r?\n/).forEach(function(header) {
          var _ref4, k, v;
          _ref4 = header.split(': ');
          k = _ref4[0];
          v = _ref4[1];
          return (hs[k.toLowerCase()] = v);
        });
        return {
          headers: hs,
          body: body
        };
      }
    }).filter(function(e) {
      return !!e;
    });
  },
  extractBoundary: function(header_string) {
    var c;
    return (c = header_string.match(/boundary=([A-Za-z0-9\'()+_,-.\/:=?]+)/)) ? c[1] : null;
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
    },
  uniq: function(array) {
        var a = [];
        var l = array.length;
        for(var i=0; i<l; i++) {
          for(var j=i+1; j<l; j++) {
            // If array[i] is found later in the array
            if (array[i] === array[j])
              j = ++i;
          }
          a.push(array[i]);
        }
        return a;
      }
};