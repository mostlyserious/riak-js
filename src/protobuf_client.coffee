Client   = require './client'
Pool     = require './protobuf'
CoreMeta = require './meta'

class Meta extends CoreMeta
  # Adds a RpbContent structure, see RpbPutReq for usage.
  withContent: (body) ->
    @content = 
      value:           @encode body
      contentType:     @contentType
      charset:         @charset
      contentEncoding: @contentEncoding
      # links
      # usermeta
    this

class ProtoBufClient extends Client
  ## CORE Riak-JS methods

  get: (bucket, key, options) ->
    (callback) =>
      meta = new Meta bucket, key, options
      @pool.send("GetReq", meta) (data) =>
        callback @processValueResponse(meta, data), meta

  save: (bucket, key, body, options) ->
    (callback) =>
      meta = new Meta bucket, key, options
      @pool.send("PutReq", meta.withContent(body)) (data) =>
        callback @processValueResponse(meta, data), meta

  remove: (bucket, key, options) ->
    (callback) =>
      meta = new Meta bucket, key, options
      @pool.send("DelReq", meta) (data) ->
        callback data

  ping: ->
    (callback) =>
      @pool.send('PingReq') (data) ->
        callback data

  end: ->
    @pool.end()

  ## PBC Specific Riak-JS methods.

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

  serverInfo: ->
    (callback) =>
      @pool.send('GetServerInfoReq') (data) ->
        callback data

  ## PRIVATE

  processValueResponse: (meta, data) ->
    delete meta.content
    if data.content? and data.content[0]? and data.vclock?
      value       = data.content[0].value
      delete        data.content[0].value
      meta.load     data.content[0]
      meta.vclock = data.vclock
      meta.decode   value

ProtoBufClient.prototype.__defineGetter__ 'pool', ->
  @_pool ||= new Pool(@options)

ProtoBufClient.Meta = Meta
module.exports      = ProtoBufClient