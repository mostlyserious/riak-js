module.exports =
  
  toJSON: (data) -> JSON.stringify data, (key, val) -> if typeof val is 'function' then val.toString() else val

  parseMultipart: (data, boundary) ->
    
    escape = (text) -> text.replace /[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"
    
    data = data.split(new RegExp("\r?\n--#{escape boundary}--\r?\n"))?[0] or ""
    
    data.split(new RegExp("\r?\n--#{escape boundary}\r?\n")).filter((e) -> !!e).map (part) ->

      if (md = part.split /\r?\n\r?\n/)
        [headers, body] = md
        
        hs = {}
        headers.split(/\r?\n/).forEach (header) ->
          [k,v] = header.split(': ')
          hs[k.toLowerCase()] = v
          
        { headers: hs, body: body }
          
    .filter (e) -> !!e
    
  extractBoundary: (header_string) -> if (c = header_string.match /boundary=([A-Za-z0-9\'()+_,-.\/:=?]+)/) then c[1]

  mixin: `function() {
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
    }`
    
  uniq: `function(array) {
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
      }`
    
  # mixin: (a, b) ->
  #   if not b then return a
  #   target = a
  # 
  #   for key, value of b
  #     if typeof value is 'object'
  #       target = this.mixin (target[key] or= {}), value
  #     else
  #       target[key] = value
  # 
  #   return a