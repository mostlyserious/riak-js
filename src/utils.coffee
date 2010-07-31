module.exports =
  
  path: (bucket, key) -> "#{bucket}/#{if key then key else ''}"
  
  isArray: (obj) -> !!(obj and obj.concat and obj.unshift and not obj.callee)
  
  toJSON: (data) -> JSON.stringify data, (key, val) ->
    if typeof val is 'function' then val.toString() else val
    
  toQuery: (query, riak) ->
    # use boolean strings since riak expects those
    for k in query
      if typeof query[k] is 'boolean'
        query[k] = String(query[k])
    riak.stringifyQuery(query)
        
  ensure: (obj) -> obj or {}
  
  makePhases: (type, phase, args) ->
    phase = [phase] if not this.isArray phase
    
    phase.map (p) ->
      temp = {}
      temp[type] = switch typeof p
        when 'function' then {source: p.toString(), arg: args}
        when 'string' then {name: p, arg: args}
        when 'object' then p
      temp
    
  stringToLinks: (links) ->
    result = []
    if links
      links.split(',').forEach (link) ->
        r = link.trim().match(/^<\/(.*)\/(.*)\/(.*)>;\sriaktag="(.*)"$/)
        result.push({bucket: decodeURIComponent(r[2]), key: decodeURIComponent(r[3]), tag: decodeURIComponent(r[4])}) if r
    result
    
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