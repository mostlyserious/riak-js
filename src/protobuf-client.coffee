Client = require './client'
Pool   = require './protobuf'
Meta   = require './meta'

class ProtoBufClient extends Client
  get: (bucket, key, options) ->
    options      ||= {}
    options.bucket = bucket
    options.key    = key
    (callback) =>
      @pool.send("GetReq", options) (data) ->
        content = data.content[0]
        if content? and data.vclock?
          value = content.value
          delete  content.value
          meta = new Meta bucket, key, content
          meta.vclock = data.clock
          callback meta.decode(value), meta
        else
          callback()

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