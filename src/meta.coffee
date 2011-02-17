Utils = require './utils'
querystring = require 'querystring'

class Meta
  # options may be a plain object or a Meta
  # partial is only meant for subclasses to provide a half-baked meta
  constructor: (bucket, key, options) ->
    if arguments.length is 1 and bucket instanceof Object
      options = bucket # (in case the first arg is an object)
      [bucket, key] = [options.bucket, options.key]

    @load options      
    @bucket = bucket
    @key = key    

  # Parses a Riak value into a Javascript object, and from
  # available information does its best to determine a suitable encoder.
  #
  #   meta.decode("{\"a\":1}") # => {a: 1}
  decode: (data) ->
    if @responseEncoding is 'binary' or @checkBinary(@contentType)
      # not completely sure @responseEncoding is http only -- otherwise move down to http_meta
      new Buffer(data, 'binary')
    else
      switch @contentType
        when "application/json" then JSON.parse data
        else data

  # Encodes a Javascript object into a Riak value, and from
  # available information does its best to determine three properties:
  #
  #  - content type
  #  - binary (true/false)
  #  - instance type (Buffer/String)
  # 
  #   meta.encode({a: 1}) # => "{\"a\":1}"
  encode: (data) ->
    
    # content-type: guess if not present
    @contentType =
      if @contentType?
        # expand if it's in short from, 'html' => 'text/html'
        @resolveType @contentType
      else
        # if buffer => octet-stream; else try json; else plain text
        if data instanceof Buffer
          @resolveType 'binary'
        else if typeof data is 'object'
          json = JSON.stringify data
          @resolveType 'json'
        else
          @resolveType 'plain'
    
    # binary
    @binary = @checkBinary @contentType
    
    # instance
    if @binary and not data instanceof Buffer
      data = new Buffer(data, 'binary')
    
    switch @contentType
      when "application/json"
        json or JSON.stringify data  # in case it was already done
      else
        if @binary?
          data
        else
          data.toString()

  # calls encode on data
  encodeData: () ->
    @data = @encode(@data) if @data?

  # Fills in a full content type based on a few defaults
  resolveType: (type) ->
    switch type
      when 'json'                 then 'application/json'
      when 'xml', 'html', 'plain' then "text/#{type}"
      when 'jpeg', 'gif', 'png'   then "image/#{type}"
      when 'binary'               then 'application/octet-stream'
      else                        type
      
  # Checks if the given content type is a binary format
  checkBinary: (type) -> /octet|^image|^video/.test type

  # Loads the given options into this Meta object.  Any Riak properties are set
  # on the object directly. Anything custom is assumed to be custom Riak 
  # userdata, and will live on meta.usermeta.
  load: (options, additionalProperties, additionalDefaults) ->
    defaults = Utils.mixin true, {}, Meta.defaults, additionalDefaults

    # ensure links is an array
    options.links = [options.links] if options?.links and not Array.isArray(options.links)
    
    @usermeta = options?.usermeta or {} # get previous usermeta
    @usermeta = Utils.mixin true, @usermeta, defaults, this, options
    delete @usermeta.usermeta # remove old, mixed-in usermeta
    
    props = Utils.uniq Meta.riakProperties
      .concat(additionalProperties)
      .concat(Object.keys defaults)
    
    props.forEach (key) =>
      value = @popKey(key) ? Meta.defaults[key]
      if value?
        this[key] = value
      else
        delete this[key]

  # Pull the value at the given key from the given object, and then removes
  # it from the object.
  popKey: (key) ->
    value = @usermeta[key]
    delete  @usermeta[key]
    value
    
  # query properties to string

  stringifyQuery: (query) ->
    for key, value of query
      query[key] = String(value) if typeof value is 'boolean' # stringify booleans
    querystring.stringify(query)
  
  # operations on links  
  
  addLink: (link) ->
    if link
      dupe = @links.some (l) ->
        l.bucket is link.bucket and l.key is link.key and (l.tag or '_') is (link.tag or '_')
      @links.push(link) unless dupe

  removeLink: (link) ->
    if link
      @links = @links.filter (l) ->
        l.bucket isnt link.bucket or l.key isnt link.key or (l.tag isnt link.tag and l.tag isnt '_')
    

# Any set properties that aren't in this array are assumed to be custom 
# headers for a Riak value.
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
  'range'
  'contentRange'
  'acceptRanges'
]

# Defaults for Meta properties
Meta.defaults =
  links: []
  binary: false
  raw: 'riak'
  clientId: 'riak-js'
  contentEncoding: 'utf8'

  # reserved by riak-js
  debug: true # print stuff out
  data: undefined # attach request body data to meta
  
  # content-type
  # see @encode -- too complex to have just one simple default

module.exports = Meta