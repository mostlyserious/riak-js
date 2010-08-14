Client = require './client'
Pool   = require './protobuf'
sys = require 'sys'
class ProtoBufClient extends Client
  buckets: ->
    (callback) =>
      @pool.send('ListBucketsReq') (data) ->
        callback data.buckets

  keys: (bucket) ->
    (callback) =>
      allKeys = []
      @pool.send('ListKeysReq', bucket: bucket) (data) ->
        if data.keys
          data.keys.forEach (key) -> allKeys.push(key)
        if data.done
          callback allKeys

  ping: ->
    (callback) =>
      @pool.send('PingReq') (data) ->
        callback data

  serverInfo: ->
    (callback) =>
      @pool.send('GetServerInfoReq') (data) ->
        callback data

  end: ->
    @pool.end()

ProtoBufClient.prototype.__defineGetter__ 'pool', ->
  @_pool ||= new Pool(@options)

module.exports = ProtoBufClient