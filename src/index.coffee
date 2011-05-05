module.exports =

  # Gets a new client instance using the HTTP REST api.
  http: (options) -> new @HttpClient options

  # Gets a new client instance using the protocol buffer api.
  protobuf: (options) ->
    options ||= {}
    pool      = options.pool
    delete options.pool
    pool   ||= new @ProtobufPool options
    cli      = new @ProtobufClient options
    cli.pool = pool
    cli

  defaults: { api: 'http' }

  getClient: (options) ->
    options or= {}
    options.api or= module.exports.defaults.api
    module.exports[options.api] options

  getSessionStore: (options) ->
    new @SessionStore options

# exports

module.exports.__defineGetter__ 'HttpClient', ->
  @_httpClient ||= require './http_client'

module.exports.__defineGetter__ 'ProtobufClient', ->
  @_pbcClient ||= require './protobuf_client'

module.exports.__defineGetter__ 'ProtobufPool', ->
  @_pbcPool ||= require './protobuf'

module.exports.__defineGetter__ 'TestServer', ->
  @_testServer ||= require './test_server'

module.exports.__defineGetter__ 'SessionStore', ->
  @_sessionStore ||= require './session_store'