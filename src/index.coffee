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
exports.__defineGetter__ 'ProtoBufClient', ->
  @_pbcClient ||= require './protobuf_client'

exports.__defineGetter__ 'HttpClient', ->
  @_pbcClient ||= require './http_client'

exports.defaults =
  api: 'http'

exports.getClient = (options) ->
  options.api ||= exports.defaults.api
  exports[options.api] options

# Gets a new client instance using the HTTP REST api.
exports.http = (options) ->
  new exports.HttpClient(options)

# Gets a new client instance using the protocol buffer api.
exports.protobuf = (options) ->
  new exports.ProtoBufClient options
