Utils = require './utils'
querystring = require 'querystring'

class Meta
  # options may be a plain object or a Meta
  # partial is only meant for subclasses to provide a half-baked meta
  constructor: (bucket, key, options) ->
    if arguments.length is 1 and bucket instanceof Object
      options = bucket # (in case the first arg is an object)
      [bucket, key] = [options.bucket, options.key]

    meta = if options instanceof Meta
      options
    else
      @load options
      this
    
    [meta.bucket, meta.key] = [bucket, key]
    
    return meta

  # Parses a Riak value into a Javascript object.  Set custom decoders on 
  # Meta.decoders:
  #
  #   # parse all JSON data
  #   Meta.decoders['application/json'] = (string) ->
  #     JSON.parse string
  #
  #   meta.decode("{\"a\":1}") # => {a: 1}
  decode: (value) ->
    if dec = Meta.decoders[@contentType]
      dec value
    else
      value

  # Encodes a Javascript object into a Riak value.  Set custom encoders on 
  # Meta.encoders:
  #
  #   # Convert JSON data
  #   Meta.encoders['application/json'] = (value) ->
  #     JSON.stringify value
  #
  #   meta.encode({a: 1}) # => "{\"a\":1}"
  encode: (value) ->
    if value instanceof Buffer then @contentType = @guessType 'binary'
    if dec = Meta.encoders[@contentType]
      dec value
    else
      value.toString()

  # Loads the given options into this Meta object.  Any Riak properties are set
  # on the object directly. Anything custom is assumed to be custom Riak 
  # userdata, and will live on meta.usermeta.
  load: (options, additionalProperties, additionalDefaults) ->
    defaults = Utils.mixin true, {}, Meta.defaults, additionalDefaults
    # FIXME this is a workaround here because the mixin turns the link {} into a [] ... rewrite that stupid motherfucker
    if options?.links
      options.links = [options.links] unless Array.isArray(options.links) # DRY!
    
    @usermeta = Utils.mixin true, {}, defaults, this, options
    
    props = Utils.uniq Meta.riakProperties
      .concat(additionalProperties)
      .concat(Object.keys defaults)
      
    props.forEach (key) =>
      value = @popKey(key) ? Meta.defaults[key]
      if value? then this[key] = value
      else delete this[key]

  encodeData: () ->
    @data = @encode(@data) if @data?

  # Fills in a full content type based on a few defaults
  guessType: (type) ->
    switch type
      when 'json'                 then 'application/json'
      when 'xml', 'html', 'plain' then "text/#{type}"
      when 'jpeg', 'gif', 'png'   then "image/#{type}"
      when 'binary'               then 'application/octet-stream'
      else                        type

  # Pull the value at the given key from the given object, and then removes
  # it from the object.
  popKey: (key) ->
    value = @usermeta[key]
    delete  @usermeta[key]
    value

  stringifyQuery: (query) ->
    for key, value of query
      query[key] = String(value) if typeof value is 'boolean' # stringify booleans
    querystring.stringify(query)
  
  # operations on links  
  
  addLink: (link) -> @links.push(link)
  
  removeLink: (link) -> @links = @links.filter (l) ->
    l.bucket isnt link.bucket or l.key isnt link.key or (l.tag isnt link.tag and l.tag isnt '_')
  

# Any set properties that aren't in this array are assumed to be custom 
# headers for a riak value.
Meta.riakProperties = [
  'bucket' # both
  'key' # both
  'contentType' # both
  'vclock' # both
  'lastMod' # both
  'lastModUsecs' # both
  'charset' # ?
  'contentEncoding' # ?
  'r' # both
  'w' # both
  'dw' # both
  'rw' # both
  'links' # both
  'etag' # ?
  'raw' # ?
  'clientId' # both
  'returnbody' # both
  'vtag' # both
]

# Defaults for Meta properties.
Meta.defaults =
  links:        []
  contentType: 'json'
  raw: 'riak'
  clientId: 'riak-js' # fix default clientId
  contentEncoding: 'utf8'

  # reserved by riak-js
  debug: true # print stuff out
  data: undefined # attach submission data to meta

Meta.decoders =
  "application/json": (s) ->
    JSON.parse s

Meta.encoders =
  "application/json": (data) ->
    JSON.stringify data
  "application/octet-stream": (data) ->
    data = new Buffer(data) unless data instanceof Buffer
    data

Meta::__defineGetter__ 'contentType', -> @_type

Meta::__defineSetter__ 'contentType', (type) ->
  @_type = @guessType(type || 'json')
  if @_type.match(/octet/) || @_type.match(/^image/)
    @binary = true
  else
    @binary = false
  @_type

module.exports = Meta
