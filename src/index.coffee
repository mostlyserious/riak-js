module.exports = 

  # Gets a new client instance using the HTTP REST api.
  http: (options) -> new @HttpClient options

  # Gets a new client instance using the protocol buffer api.
  protobuf: (options) ->
    options ||= {}
    pool      = options.pool
    delete options.pool
    pool   ||= new @ProtoBufPool options
    cli      = new @ProtoBufClient options
    cli.pool = pool
    cli
    
  defaults: { api: 'http' }
  
  getClient: (options) ->
    options or= {}
    options.api or= module.exports.defaults.api
    @[options.api] options

module.exports.__defineGetter__ 'ProtoBufClient', ->
  @_pbcClient ||= require './protobuf_client'

module.exports.__defineGetter__ 'ProtoBufPool', ->
  @_pbcPool ||= require './protobuf'

module.exports.__defineGetter__ 'HttpClient', ->
  @_httpClient ||= require './http_client'