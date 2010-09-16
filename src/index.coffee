# some ideas:
#
# riak = require 'riak-js'
#
# # Get HTTP client
# db = riak.http({host: '...', interface: '...'})
#
# # Get protobuf client
# db = riak.protobuf({host: '...'})
#
exports.getClient = (options) ->
  options or= {}
  options.api or= exports.defaults.api
  exports[options.api] options

# Gets a new client instance using the HTTP REST api.
exports.http = (options) ->
  new exports.HttpClient(options)

# Gets a new client instance using the protocol buffer api.
exports.protobuf = (options) ->
  options ||= {}
  pool      = options.pool
  delete options.pool
  pool   ||= new exports.ProtoBufPool(options)
  cli      = new exports.ProtoBufClient options
  cli.pool = pool
  cli

exports.defaults =
  api: 'http'

exports.__defineGetter__ 'ProtoBufClient', ->
  @_pbcClient ||= require './protobuf_client'

exports.__defineGetter__ 'ProtoBufPool', ->
  @_pbcPool ||= require './protobuf'

exports.__defineGetter__ 'HttpClient', ->
  @_httpClient ||= require './http_client'