Client   = require './client'
Pool     = require './protobuf'
CoreMeta = require './meta'
Mapper   = require './mapper'
utils    = require './utils'

class Meta extends CoreMeta
  # Adds a RpbContent structure, see RpbPutReq for usage.
  withContent: (body) ->
    @content = 
      value:           @encode body
      contentType:     @contentType
      charset:         @charset
      contentEncoding: @contentEncoding
      links:           @encodeLinks   @links
      usermeta:        @encodeUsermeta @usermeta
      # links
      # usermeta
    delete @usermeta
    delete @links
    this

  encodeLinks: (links) ->
    parsed = []
    if links && !utils.isArray(links)
      links = [links]
    links.forEach (link) ->
      parsed.push link
    parsed

  encodeUsermeta: (data) ->
    parsed = []
    for all key, value of data
      parsed.push key: key, value: value
    parsed

class ProtoBufClient extends Client
  ## CORE Riak-JS methods

  get: (bucket, key, options) ->
    (callback) =>
      meta = new Meta bucket, key, options
      @send("GetReq", meta) (data) =>
        callback @processValueResponse(meta, data), meta

  save: (bucket, key, body, options) ->
    (callback) =>
      meta = new Meta bucket, key, options
      @send("PutReq", meta.withContent(body)) (data) =>
        callback @processValueResponse(meta, data), meta

  remove: (bucket, key, options) ->
    (callback) =>
      meta = new Meta bucket, key, options
      @send("DelReq", meta) callback

  map: (phase, args) ->
    new Mapper this, 'map', phase, args
  
  reduce: (phase, args) ->
    new Mapper this, 'reduce', phase, args
  
  link: (phase) ->
    new Mapper this, 'link', phase

  ping: ->
    (callback) =>
      @send('PingReq') callback

  end: ->
    @connection.end() if @connection

  ## PBC Specific Riak-JS methods.

  buckets: ->
    (callback) =>
      @send('ListBucketsReq') (data) ->
        callback data.buckets

  keys: (bucket) ->
    (callback) =>
      keys = []
      @send('ListKeysReq', bucket: bucket) (data) =>
        @processKeysResponse data, keys, callback

  serverInfo: ->
    (callback) =>
      @send('GetServerInfoReq') callback

  ## PRIVATE

  runJob: (job) ->
    (callback) =>
      body = request: JSON.stringify(job.data), contentType: 'application/json'
      resp = phases: []
      @send("MapRedReq", body) (data) =>
        @processMapReduceResponse data, resp, callback

  send: (name, data) ->
    if @connection? && @connection.writable
      @connection.send(name, data)
    else
      (callback) =>
        @pool.start (conn) =>
          @connection = conn
          @connection.send(name, data)(callback)

  processKeysResponse: (data, keys, callback) ->
    if data.errcode
      callback data
    if data.keys
      data.keys.forEach (key) -> keys.push(key)
    if data.done
      callback keys

  processMapReduceResponse: (data, resp, callback) ->
    if data.errcode
      callback data
    if data.phase?
      resp.phases.push data.phase if resp.phases.indexOf(data.phase) == -1
      parsed = JSON.parse data.response
      if resp[data.phase]? # if it exists, assume it's an array and APPEND
        parsed.forEach (item) ->
          resp[data.phase].push item
      else
        resp[data.phase] = parsed
    if data.done
      callback resp

  processValueResponse: (meta, data) ->
    delete meta.content
    if data.content? and data.content[0]? and data.vclock?
      [content, value] = @processValue data.content[0]
      meta.load     content
      meta.vclock = data.vclock
      meta.decode   value

  processValue: (content) ->
    value = content.value
    if content.usermeta?.forEach?
      content.usermeta.forEach (pair) ->
        content[pair.key] = pair.value
    delete content.value
    delete content.usermeta
    [content, value]

ProtoBufClient.Meta = Meta
module.exports      = ProtoBufClient