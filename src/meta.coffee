# Stores the meta data for a riak object.
class Meta
  constructor: (bucket, key, options) ->
    @bucket          = bucket
    @key             = key
    @options         = options || {}
    Meta.riakProperties.forEach (key) =>
      this[key] = @popKey(key) || 
        Meta.riakPropertyDefaults[key]

  # Fills in a full content type based on a few defaults
  guessType: (type) ->
    switch type
      when 'json'               then 'application/json'
      when 'xml', 'plain'       then "text/" + type
      when 'jpeg', 'gif', 'png' then "image/" + type
      when 'binary'             then 'application/octet-stream'
      else                           type

  # Pull the value at the given key from the given object, and then removes
  # it from the object.
  popKey: (key) ->
    value = @options[key]
    delete  @options[key]
    value

# Any set properties that aren't in this array are assumed to be custom 
# headers for a riak value.
Meta.riakProperties = ['type', 'vclock', 'etag', 'lastModified', 'interface',
  'vtag', 'charset', 'contentEncoding', 'statusCode', 'links']

# Defaults for Meta properties.
Meta.riakPropertyDefaults =
  links: []
  type:  'json'

Meta.prototype.__defineGetter__ 'type', () ->
  @_type

Meta.prototype.__defineSetter__ 'type', (type) ->
  @_type = @guessType(type || 'json')
  if @_type.match(/octet/) || @_type.match(/^image/)
    @binary = true
  else
    @binary = false
  @_type

module.exports = Meta