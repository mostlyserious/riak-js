CoreMeta = require './meta'

class Client
  
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

process.on 'uncaughtException', (err) ->
  # warn that something went wrong - node should be restarted?
  # http://www.debuggable.com/posts/node-js-dealing-with-uncaught-exceptions:4c933d54-1428-443c-928d-4e1ecbdd56cb
  console.err err

module.exports = Client