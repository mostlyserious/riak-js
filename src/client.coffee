CoreMeta = require './meta'

class Client
  
  executeCallback: (data, meta, callback) ->
    callback or= (err, data, meta) =>
      @log data, json: @contentType is 'json'
    callback(data instanceof Error or null, data, meta)
    
  log: (string, options) ->
    options or= {}
    if string and console and (if options.debug isnt undefined then options.debug else CoreMeta.defaults.debug)
      if options.json then console.dir string else console.log string

module.exports = Client