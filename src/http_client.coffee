Client = require './client'
Meta = require './http_meta'
Mapper = require './mapper'
Utils = require './utils'
http = require 'http'
{ EventEmitter } = require 'events'

class HttpClient extends Client
  constructor: (options) ->
    options = Utils.mixin true, {}, Meta.defaults, options
    super options

  get: (bucket, key, options...) ->
    [options, callback] = @ensure options
    meta = new Meta bucket, key, options
    @execute 'GET', meta, callback

  head: (bucket, key, options...) ->
    [options, callback] = @ensure options
    meta = new Meta bucket, key, options
    @execute 'HEAD', meta, callback

  exists: (bucket, key, options...) ->
    [options, callback] = @ensure options

    @head bucket, key, options, (err, data, meta) ->
      if meta?.statusCode is 404
        callback(null, false, meta)
      else if err
        callback(err, data, meta)
      else
        callback(err, true, meta)

  getAll: (bucket, options...) ->
    [options, callback] = @ensure options

    mapfunc = (v, k, options) ->
      data = if options.noJSON then Riak.mapValues(v)[0] else Riak.mapValuesJson(v)[0]
      if options.where and not options.noJSON
        keys = []; `for (var i in options.where) keys.push(i)`
        if keys.some((k) -> options.where[k] isnt data[k]) then return []
      delete v.values
      [{ meta: v, data: data }]
      
    @add(bucket).map(mapfunc, options).run(callback)

  keys: (bucket, options...) ->
    [options, callback] = @ensure options
    meta = new Meta bucket, undefined, options
    meta.keys or= true
    
    if meta.keys == 'stream'
      meta._emitter = new EventEmitter()
    
      meta._emitter.start = =>
        @execute 'GET', meta, (err, data, meta) ->
          delete meta._emitter if meta
          callback(err, data, meta)

      return meta._emitter

    else
      @get bucket, undefined, meta, (err, obj) ->
        callback(err, obj?.keys)

  count: (bucket, options...) ->
    [options, callback] = @ensure options
    options.keys = 'stream'
    buffer = []
    
    stream = @keys bucket, options, (err, data, meta) ->
      callback(err, buffer.length, meta)
    
    stream.on 'keys', (keys) -> for k in keys then buffer.push(k)
    stream.start()

  walk: (bucket, key, spec, options...) ->
    [options, callback] = @ensure options
    linkPhases = spec.map (unit) ->
      bucket: unit[0] or '_', tag: unit[1] or '_', keep: unit[2]?
    map = if options.noJSON then 'Riak.mapValues' else 'Riak.mapValuesJson'

    @add(if key then [[bucket, key]] else bucket)
      .link(linkPhases)
      .reduce(language: 'erlang', module: 'riak_kv_mapreduce', function: 'reduce_set_union')
      .map(map)
      .run(options, callback)

  save: (bucket, key, data, options...) ->
    [options, callback] = @ensure options

    meta = new Meta bucket, key, options
    meta.data = data or {}

    verb = options.method or if key then 'PUT' else 'POST'
    @execute verb, meta, callback

  update: (bucket, key, newData, options...) ->
    [options, callback] = @ensure options
    
    @get bucket, key, options, (err, data) =>
      if err then return callback(err)
      data = Utils.mixin(true, {}, data, newData)
      @save bucket, key, data, options, callback

  remove: (bucket, key, options...) ->
    [options, callback] = @ensure options
    meta = new Meta bucket, key, options
    @execute 'DELETE', meta, callback

  # map/reduce

  add: (inputs) -> new Mapper this, inputs

  runJob: () ->
    [options, callback] = @ensure arguments
    options.raw or= 'mapred'
    @save '', '', options.data, options, callback

  end: ->

  # bucket props

  buckets: () ->
    [options, callback] = @ensure arguments
    meta = new Meta '', '', options
    meta.buckets = true
    @execute 'GET', meta, callback

  getProps: (bucket, options...) ->
    [options, callback] = @ensure options
    @get bucket, undefined, options, (err, obj) ->
      callback(err, obj.props)

  updateProps: (bucket, props, options...) ->
    [options, callback] = @ensure options
    options.method = 'PUT'
    @save bucket, undefined, { props: props }, options, callback
    
  # search

  enableIndex: (bucket, options...) ->
    [options, callback] = @ensure options
    @getProps bucket, options, (err, props) =>
      hook = { mod: 'riak_search_kv_hook', fun: 'precommit' }
      props.precommit.push hook unless (props.precommit.some (p) -> p.mod is hook.mod)
      @updateProps bucket, props, options, callback

  disableIndex: (bucket, options...) ->
    [options, callback] = @ensure options
    @getProps bucket, options, (err, props) =>
      props.precommit = for p in props.precommit when p.mod isnt 'riak_search_kv_hook' then p
      @updateProps bucket, props, options, callback
      
  search: (index, query, options...) ->
    [options, callback] = @ensure options
    options.raw or= 'solr'
    options.rows or= 10000
    options.wt = 'json'
    options.q = query
    meta = new Meta index, 'select', options
    @execute 'GET', meta, (err, data, meta) ->
      callback(err, data?.response, meta)

  addSearch: (index, query) ->
    @add({ module: 'riak_search', function: 'mapred_search', arg: [index, query] })

  # luwak

  getLarge: (key, options...) ->
    [options, callback] = @ensure options
    options.raw or= 'luwak'
    options.responseEncoding = 'binary'
    @get undefined, key, options, callback

  saveLarge: (key, data, options...) ->
    [options, callback] = @ensure options
    options.raw or= 'luwak'

    if data instanceof Buffer
      @save undefined, key, data, options, callback
    else
      callback(new Error('Data has to be a Buffer'))

  removeLarge: (key, options...) ->
    [options, callback] = @ensure options
    options.raw or= 'luwak'
    @remove undefined, key, options, callback
    
  # node commands

  ping: () ->
    [options, callback] = @ensure arguments
    meta = new Meta '', '', raw: 'ping'
    @execute 'HEAD', meta, (err) -> callback(null, !err?)

  stats: () ->
    [options, callback] = @ensure arguments
    meta = new Meta '', '', raw: 'stats'
    @execute 'GET', meta, callback

  # provide particular Meta impl to clients

  Meta: Meta

  # private

  execute: (verb, meta, callback) ->
    
    meta.method = verb.toUpperCase()
    meta.headers = meta.toHeaders()    
    Client.debug "#{meta.method} #{meta.path}", meta

    request = http.request meta, (response) =>
      
      # using meta as options, to which the HTTP Agent is attached
      # we don't want to carry this around in a Meta
      delete meta.agent
    
      response.setEncoding meta.responseEncoding
      
      buffer = ''
      firstChunk = false
      tempBuffer = ''

      response.on 'data', (chunk) ->
      
        if meta._emitter

          unless firstChunk # only buffer the first chunk, the rest will be emitted
            buffer += chunk
            firstChunk = true

          else
          
            tempBuffer += chunk
          
            m = tempBuffer.match /\}\{?/
            if m?.index  # contiguous chunks
              head = tempBuffer.substr(0, m.index+1)
              tail = tempBuffer.substr(m.index+1)
              tempBuffer = tail
            
              try
                meta._emitter.emit 'keys', JSON.parse(head).keys
              catch err
                @emit 'clientError', err

        else
          buffer += chunk
      
      response.on 'end', =>
      
        if meta._emitter
          meta._emitter.emit 'end'

        meta = meta.loadResponse response

        buffer = if 400 <= meta.statusCode <= 599
          err = new Error "HTTP error #{meta.statusCode}: #{buffer}"
          err.message = undefined if meta.statusCode is 404 # message == undefined to be in sync with pbc
          err.statusCode = meta.statusCode # handier access to the HTTP status in case of an error
          err
        else @decodeBuffer(buffer, meta, verb)

        if meta.statusCode is 300 and meta.contentType.match /^multipart\/mixed/ # multiple choices
          boundary = Utils.extractBoundary meta.contentType
          buffer = Utils.parseMultipart(buffer, boundary).map (doc) =>
            _meta = new Meta(meta.bucket, meta.key)
            _meta.loadResponse { headers: doc.headers, statusCode: meta.statusCode }
            _meta.vclock = meta.vclock
            { meta: _meta, data: @decodeBuffer(doc.body, _meta, verb) }

        if buffer instanceof Error
          err = buffer
          data = buffer.message
          err.notFound = meta?.statusCode is 404
        
        callback err, buffer, meta

    if meta.data
      request.write meta.data, meta.contentEncoding
      delete meta.data
    
    request.on 'error', (err) =>
      @emit 'clientError', err
      callback err
    
    request.end()
    return undefined # otherwise the repl prints out the returned value by request.end()
    
  # http client utils

  decodeBuffer: (buffer, meta, verb) ->
    try
      if meta.statusCode is 204 or verb is 'HEAD' then undefined
      else if buffer == "" then buffer
      else meta.decode(buffer)
    catch e
      new Error "Cannot convert response into #{meta.contentType}: #{e.message} -- Response: #{buffer}"

module.exports = HttpClient
