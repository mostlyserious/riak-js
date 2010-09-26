Client   = require './client'
CoreMeta     = require './meta'
Mapper = require './mapper'
Utils    = require './utils'
Http = require 'http'
querystring = require 'querystring'

class HttpClient extends Client
  constructor: (options) ->
    # client-specific defaults
    [host, port] = ['localhost', 8098]
    
    # upon initialization, core meta should merge user-provided defaults for the session
    CoreMeta.defaults = Utils.mixin true, CoreMeta.defaults, options
    
    @client = Http.createClient options?.port or port, options?.host or host
    
    
  get: (bucket, key, options...) ->
    [options, callback] = @ensure options
    meta = new Meta bucket, key, options
    @execute('GET', meta) (data, meta) =>
      @executeCallback data, meta, callback

  head: (bucket, key, options...) ->
    [options, callback] = @ensure options
    meta = new Meta bucket, key, options
    @execute('HEAD', meta) (data, meta) =>
      @executeCallback data, meta, callback
      
  getAll: (bucket, options...) ->
    [options, callback] = @ensure options
    mapfunc = if options.noJSON then 'Riak.mapValues' else 'Riak.mapValuesJson'
    limiter = null
    
    if options.withId
      mapfunc = if options.noJSON then (v) -> [[v.key, Riak.mapValues(v)[0]]] else (v) -> [[v.key, Riak.mapValuesJson(v)[0]]]
    
    if options.where
      limiter = options.where
      mapfunc = 'Riak.mapByFields'
        
    @add(bucket).map(mapfunc, limiter).run callback
 
  keys: (bucket, options...) ->
    [options, callback] = @ensure options
    options.keys = true
    meta = new Meta bucket, '', options
    @execute('GET', meta) (data, meta) =>
      @executeCallback data.keys, meta, callback
  
  count: (bucket, options...) ->
    [options, callback] = @ensure options
    @add(bucket).map((v) -> if v.not_found then [] else [1]).reduce((v) -> [v.length]).run callback
    
  walk: (bucket, key, spec, options...) ->
    [options, callback] = @ensure options
    linkPhases = spec.map (unit) ->
      bucket: unit[0] or '_', tag: unit[1] or '_', keep: !!unit[2]
    
    @link(linkPhases).reduce(language: 'erlang', module: 'riak_kv_mapreduce', function: 'reduce_set_union')
      .map('Riak.mapValuesJson')
      .run((if key then [[bucket, key]] else bucket), options, callback)
   
  save: (bucket, key, data, options...) ->
    [options, callback] = @ensure options
    data or= {}

    meta = new Meta bucket, key, options
    meta.data = data

    verb = options.method or if key then 'PUT' else 'POST'
    @execute(verb, meta) (data, meta) =>
      @executeCallback data, meta, callback
  
  remove: (bucket, key, options...) ->
    [options, callback] = @ensure options
    meta = new Meta bucket, key, options
    @execute('DELETE', meta) (data, meta) =>
      @executeCallback data, meta, callback

  # map/reduce

  add: (inputs) -> new Mapper this, inputs
    
  runJob: (options, callback) ->
    options.raw = 'mapred'
    @save '', '', options.data, options, callback

  end: ->
    
  # bucket props
  
  getProps: (bucket, options...) ->
    [options, callback] = @ensure options
    @get bucket, undefined, options, callback
  
  updateProps: (bucket, props, options...) ->
    [options, callback] = @ensure options
    options.method = 'PUT'
    @save bucket, undefined, { props: props }, options, callback

  # node commands

  ping: (callback) ->
    meta = new Meta '', '', raw: 'ping'
    @execute('HEAD', meta) (data, meta) =>
      @executeCallback true, meta, callback

  stats: (callback) ->
    meta = new Meta '', '', raw: 'stats'
    @execute('GET', meta) (data, meta) =>
      @executeCallback data, meta, callback
        
  # private
  
  execute: (verb, meta) ->
    
    (callback) =>
    
      url = "/#{meta.raw}/#{meta.bucket}/#{meta.key or ''}"      
      verb = verb.toUpperCase()
      queryProps = {}
      
      ['r', 'w', 'dw', 'keys', 'props', 'vtag', 'nocache', 'returnbody'].forEach (prop) ->
        queryProps[prop] = meta[prop] unless meta[prop] is undefined
      
      query = @stringifyQuery queryProps
      path = "#{url}#{if query then '?' + query else ''}"
      val = meta.encode(meta.data) if meta.data
      headers = meta.toHeaders()
      
      @log "#{verb} #{path}"
     
      request = @client.request verb, path, headers
      
      # use felixge's approach
      cbFired = false
      onClose = (hadError, reason) =>
        if hadError and not cbFired then callback new Error(reason)
        @client.removeListener 'close', onClose
          
      @client.on 'close', onClose
      
      @client.on 'error', (err) -> onClose true, err

      if meta.data
        request.write val, meta.contentEncoding
        delete meta.data
      
      buffer = ''

      request.on 'response', (response) =>

        response.setEncoding meta.usermeta.responseEncoding or 'utf8'
        
        response.on 'data', (chunk) -> buffer += chunk
        response.on 'end', =>
          meta = meta.loadHeaders response.headers, response.statusCode

          buffer = if 400 <= meta.statusCode < 600
            err = new Error buffer
            err.message = undefined if meta.statusCode is 404 # message == undefined to be in sync with pbc
            err.statusCode = meta.statusCode # handier access to the HTTP status in case of an error
            err
          else @decodeBuffer(buffer, meta)
            
          if meta.statusCode is 300 and meta.contentType.match /^multipart\/mixed/ # multiple choices
            boundary = Utils.extractBoundary meta.contentType
            buffer = Utils.parseMultipart(buffer, boundary).map (doc) =>
              _meta = new Meta(meta.bucket, meta.key)
              _meta.loadHeaders doc.headers
              _meta.vclock = meta.vclock
              { meta: _meta, data: @decodeBuffer(doc.body, _meta) }
            
          cbFired = true
          callback buffer, meta
          
      request.end()

  # http client utils

  stringifyQuery: (query) ->
    for key, value of query
      query[key] = String(value) if typeof value is 'boolean' # stringify booleans
    querystring.stringify(query)

  decodeBuffer: (buffer, meta) ->
    if meta.contentType is 'application/octet-stream'
      new Buffer buffer, 'binary'
    else
      try
        if buffer.length > 0 then meta.decode(buffer) else undefined
      catch e
        new Error "Cannot convert response into #{meta.contentType}: #{e.message} -- Response: #{buffer}"

class Meta extends CoreMeta
  
  mappings:
    contentType: 'content-type'
    vclock: 'x-riak-vclock'
    lastMod: 'last-modified'
    etag: 'etag'
    links: 'link'
    host: 'host'
    clientId: 'x-riak-clientid'

  loadHeaders: (headers, statusCode) ->
    options = {}
    for k,v of @mappings
      if v is 'link'
        options[k] = @stringToLinks headers[v]
      else
        options[k] = headers[v]
        
    for k,v of headers
      u = k.match /^X-Riak-Meta-(.*)/i
      @usermeta[u[1]] = v if u

    # load destroys usermeta, so pass it in again
    @load Utils.mixin true, @usermeta, options
    @statusCode = statusCode
    
    return this
    
  toHeaders: () ->
    headers =
      Accept: "multipart/mixed, application/json;q=0.7, */*;q=0.5" # default accept header
    
    for k,v of @mappings
      if k is 'links'
        headers[v] = @linksToString()
      else
        headers[v] = this[k] if this[k]
    
    for k,v of @usermeta then headers["X-Riak-Meta-#{k}"] = v

    headers['If-None-Match'] = @etag if @etag

    return headers
    
  ##
    
  stringToLinks: (links) ->
    result = []
    if links
      links.split(',').forEach (link) ->
        captures = link.trim().match /^<\/(.*)\/(.*)\/(.*)>;\sriaktag="(.*)"$/
        if captures
          for i of captures then captures[i] = decodeURIComponent(captures[i])
          result.push new Link({bucket: captures[2], key: captures[3], tag: captures[4]})
    result
    
  linksToString: () ->
    @links.map((link) => "</#{@raw}/#{link.bucket}/#{link.key}>; riaktag=\"#{link.tag || "_"}\"").join ", "

class Link
  
  constructor: (options) ->
    @bucket = options.bucket
    @key = options.key
    @tag = options.tag

module.exports = HttpClient