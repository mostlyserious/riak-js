Client = require './client'
Pool = require './protobuf'
Meta = require './protobuf_meta'
Mapper = require './mapper'
Utils = require './utils'

class ProtobufClient extends Client
  
  constructor: (options) ->
    options = Utils.mixin true, {}, Meta.defaults, options
    super options

  get: (bucket, key, options...) ->
    [options, callback] = @ensure options
    meta = new Meta bucket, key, options
    meta.serializable = true
    @execute 'GetReq', meta, callback
    
  save: (bucket, key, data, options...) ->
    [options, callback] = @ensure options
    meta = new Meta bucket, key, options
    meta.serializable = true
    meta.data = data or {}
    @execute 'PutReq', meta, callback
    
  remove: (bucket, key, options...) ->
    [options, callback] = @ensure options
    meta = new Meta bucket, key, options
    meta.serializable = true
    @execute 'DelReq', meta, callback

  keys: (bucket, options...) ->
    [options, callback] = @ensure options
    # TODO should be real Meta
    # meta = new Meta(options)
    meta = options
    # TODO validate bucket exists
    meta.bucket = bucket
    meta.serializable = true

    processChunk = (data) -> data.keys

    cb = (err, data) ->
      result = []
      for chunk in data
        for key in chunk
          result.push key.toString()

      callback(null, result, meta)

    @execute 'ListKeysReq', meta, cb, processChunk

  # map/reduce

  add: (inputs) -> new Mapper this, inputs

  runJob: () ->
    [meta, callback] = @ensure arguments
    # TODO should be real Meta
    # meta = new Meta '', '', meta
    
    meta.request = JSON.stringify(meta.data)
    meta.contentType = 'application/json'
    meta.serializable = true

    processChunk = (data) ->
      if data.phase?
        result = try
          JSON.parse(data.response)
        catch err
          err

        [data.phase, result]

    cb = (err, data) ->
      result = []
      for [phase, elem] in data
        result[phase] = [] unless result[phase]
        result[phase] = result[phase].concat elem

      callback(err, result, meta)

    @execute 'MapRedReq', meta, cb, processChunk

  # not working
  
  # updateProps: (bucket, props, options...) ->
  #   [options, callback] = @ensure options
  #   meta = new Meta bucket, '', options
  #   meta.serializable = true
  #   meta.data = props
  #   @execute 'SetBucketReq', meta, callback
  
  ping: () ->
    [options, callback] = @ensure arguments
    meta = new Meta(options)
    meta.serializable = false
    @execute 'PingReq', meta, callback

  buckets: () ->
    [options, callback] = @ensure arguments
    meta = new Meta(options)
    meta.serializable = false
    @execute 'ListBucketsReq', meta, (err, data, meta) ->
      if not err
        data = for p in data.buckets then p.toString()
      callback(err, data, meta)

  # private
  
  actuallySend: (name, data, cb) ->
    serializable = data.serializable
    delete data.serializable # we don't need it anymore    
    if not serializable then data = undefined
    @connection.send(name, data, cb)

  send: (verb, data, cb) ->
    if @connection? and @connection.writable
      @actuallySend(verb, data, cb)
    else
      @pool.start (@connection) =>
        @actuallySend(verb, data, cb)

  execute: (verb, meta, callback, processChunk) ->
    
    cb = (response) ->
    
      if (verb == 'GetReq') or (verb == 'PutReq' and meta.returnBody)
        meta = meta.loadResponse response
        response = meta.response
        delete meta.response
      
      # TODO check for RpbErrorResp
      err = null
      
      callback(err, response, meta)
    
    ##
        
    if processChunk?
      
      buffer = []
      
      @send verb, meta, (data) ->
      
        if data.errcode then cb(data)
        
        result = processChunk(data)
        buffer.push(result) if result
        
        if data.done then cb(buffer)
      
    else
      @send(verb, meta, cb)
    
    return undefined # for the repl not to print out the return value of this function


  end: ->
    @connection.end() if @connection

  # provide particular Meta impl to clients

  Meta: Meta

module.exports = ProtobufClient