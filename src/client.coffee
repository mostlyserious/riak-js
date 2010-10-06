CoreMeta = require './meta'
Utils    = require './utils'
Meta = require './http_meta'

class Client
  
  constructor: (options) ->
    # upon initialization, core meta should merge user-provided defaults for the session
    CoreMeta.defaults = Utils.mixin true, {}, CoreMeta.defaults, options
  
  executeCallback: (data, meta, callback) ->
    callback or= (err, data, meta) =>
      @log data, json: @contentType is 'json'
    err = null
    if data instanceof Error
      err = data
      data = data.message
    
    callback err, data, meta
    
  ensure: (options) ->
    [options, callback] = options
    if typeof options == 'function'
      callback = options
      options = undefined
    return [options or {}, callback]
    
  log: (string, options) ->
    options or= {}
    if string and console and (if options.debug isnt undefined then options.debug else CoreMeta.defaults.debug)
      if options.json then console.dir string else console.log string

  # all subclasses must implement metaClass so that clients can call new db.Meta()
  Meta: -> new @metaClass # FIXME

module.exports = Client