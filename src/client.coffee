CoreMeta = require './meta'
Utils    = require './utils'
Meta = require './meta'
EventEmitter = require('events').EventEmitter

class Client extends EventEmitter

  constructor: (options) ->
    # upon initialization, core meta should merge user-provided defaults for the session
    CoreMeta.defaults = Utils.mixin true, {}, CoreMeta.defaults, options

  ensure: (options) ->
    unless Array.isArray options
      options = Array::slice.call(options)
    [options, callback] = options
    if typeof options == 'function'
      callback = options
      options = undefined

    callback or= (err, data, meta) -> Client.log data
    return [options or {}, callback]

  @debug: (string, options = {}) ->
    if options.debug ? CoreMeta.defaults.debug
      console.log "[riak-js] #{string}"
  
  @log: (message) -> console.log(message) if message

  version: '0.4'

  Meta: -> throw new Error('APIs should override this function with their particular Meta implementation.')

module.exports = Client
