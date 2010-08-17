Client   = require './client'
Pool     = require './protobuf'
CoreMeta = require './meta'
Mapper   = require './mapper'

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

  map: (phase, args) ->
    new Mapper this, 'map', phase, args
  
  reduce: (phase, args) ->
    new Mapper this, 'reduce', phase, args
  
  link: (phase) ->
    new Mapper this, 'link', phase

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
        if data.errcode
          callback data
        if data.keys
          data.keys.forEach (key) -> allKeys.push(key)
        if data.done
          callback allKeys

  serverInfo: ->
    (callback) =>
      @pool.send('GetServerInfoReq') (data) ->
        callback data

  ## PRIVATE

  runJob: (job) ->
    (callback) =>
      body = request: JSON.stringify(job.data), contentType: 'application/json'
      resp = phases: []
      @pool.send("MapRedReq", body) (data) ->
        if data.errcode
          callback data
        if data.phase
          resp.phases.push data.phase
          resp[data.phase] = JSON.parse data.response
        if data.done
          callback resp

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