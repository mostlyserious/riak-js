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
  @_pbcClient ||= require './protobuf-client'

# Gets a new client instance using the HTTP REST api.
exports.http = (options) ->

# Gets a new client instance using the protocol buffer api.
exports.protobuf = (options) ->
  new exports.ProtoBufClient(options)