#
# Module dependencies
#
utils = require './utils'

class Meta
  # Constructor
  #
  # @api private
  constructor: (key, options) ->
    @key          = key
    @options      = options || {}
    @type         = @popKey @options, 'type'
    @vclock       = @popKey @options, 'vclock'
    @etag         = @popKey @options, 'etag'
    @lastModified = @popKey @options, 'lastModified'
    @interface    = @popKey @options, 'interface'
    @statusCode   = @popKey @options, 'statusCode'
    @links        = @popKey(@options, 'links') || []

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
  popKey: (object, key) ->
    value = object[key]
    delete  object[key]
    value

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