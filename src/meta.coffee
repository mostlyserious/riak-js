Utils = require './utils'
querystring = require 'querystring'

class Meta
  # options may be a plain object or a Meta
  # partial is only meant for subclasses to provide a half-filled meta
  constructor: (options, partial) ->
    if options instanceof Meta
      return options
    else
      meta = if partial instanceof Meta then partial else this
      meta.load options
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
    # TODO refactor first bit
    if value instanceof Buffer
      @contentEncoding = 'binary'
      @contentType = @guessType @contentEncoding
      return value
    if dec = Meta.encoders[@contentType]
      dec value
    else
      value.toString()

  # Loads the given options into this Meta object.  Any Riak properties are set
  # on the object directly. Anything custom is assumed to be custom Riak 
  # userdata, and will live on meta.usermeta.
  load: (options, additionalProperties) ->
    @usermeta = Utils.mixin true, {}, Meta.defaults, options
    
    props = Utils.uniq Meta.riakProperties.concat(additionalProperties)
    props.forEach (key) =>
      value = @popKey(key) ? Meta.defaults[key]
      if value?
        value = [value] if key is 'links' and not Array.isArray value
        this[key] = value
      else
        delete this[key]

  encodeData: () ->
    @encode(@data)

  # Fills in a full content type based on a few defaults
  guessType: (type) ->
    switch type
      when 'json'               then 'application/json'
      when 'xml', 'plain'       then "text/"  + type
      when 'jpeg', 'gif', 'png' then "image/" + type
      when 'binary'             then 'application/octet-stream'
      else                           type

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
  'etag' # http only?
  'raw' # http only?
  'clientId' # both
  'data' # used to attach submission data
  'returnbody' # both
]

# Defaults for Meta properties.
Meta.defaults =
  links:        []
  contentType: 'json'
  raw: 'riak'
  clientId: 'riak-js'  # fix default clientId
  debug: true
  host: 'localhost'

Meta.decoders =
  "application/json": (s) ->
    JSON.parse s

Meta.encoders =
  "application/json": (data) ->
    JSON.stringify data

Meta::__defineGetter__ 'contentType', -> @_type

Meta::__defineSetter__ 'contentType', (type) ->
  @_type = @guessType(type || 'json')
  if @_type.match(/octet/) || @_type.match(/^image/)
    @binary = true
  else
    @binary = false
  @_type

module.exports = Meta