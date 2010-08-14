Client = require './client'
Pool   = require './protobuf'
Meta   = require './meta'

class ProtoBufClient extends Client
  get: (bucket, key, options) ->
    meta = new Meta bucket, key, options
    (callback) =>
      @pool.send("GetReq", meta) (data) =>
        callback @processValueResponse(meta, data), meta

  save: (bucket, key, data, options) ->
    meta = new Meta bucket, key, options
    meta.content = 
      value:           meta.encode data
      contentType:     meta.contentType
      charset:         meta.charset
      contentEncoding: meta.contentEncoding
      # links
      # usermeta
    (callback) =>
      @pool.send("PutReq", meta) (data) =>
        callback @processValueResponse(meta, data), meta

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

  processValueResponse: (meta, data) ->
    if data.content? and data.content[0]? and data.vclock?
      value       = data.content[0].value
      delete        data.content[0].value
      meta.load     data.content[0]
      meta.vclock = data.vclock
      meta.decode   value

  end: ->
    @pool.end()

ProtoBufClient.prototype.__defineGetter__ 'pool', ->
  @_pool ||= new Pool(@options)

module.exports = ProtoBufClient