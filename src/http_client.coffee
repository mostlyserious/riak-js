Client   = require './client'
CoreMeta     = require './meta'
Mapper = require './mapper'
Utils    = require './utils'
HttpPool = require './http_pool'
querystring = require 'querystring'

class HttpClient extends Client
  constructor: (options) ->
    # client-specific defaults
    [host, port] = ['localhost', 8098]
    
    # upon initialization, core meta should merge user-provided defaults for the session
    CoreMeta.defaults = Utils.mixin true, CoreMeta.defaults, options

    @pool or= HttpPool.createPool options?.port or port, options?.host or host
    
  log: (string, options) ->
    options or= {}
    if string
      string = JSON.stringify string if options.json
      console.log string if console and (CoreMeta.defaults.debug or options.debug)
      
  keys: (bucket, options) ->
    (callback) =>
      options or= {}
      options.keys = true
      meta = new Meta bucket, '', options
      @execute('GET', meta) (data, meta) =>
        callback data.keys, meta
    
  get: (bucket, key, options) ->
    (callback) =>
      meta = new Meta bucket, key, options
      @execute('GET', meta) (data, meta) =>
        callback data, meta
  
  save: (bucket, key, data, options) ->
    (callback) =>
      
      data or= {}
      options or= {}

      meta = new Meta bucket, key, options
      meta.data = data
      
      # usermeta?
      verb = if key then 'PUT' else 'POST'
      @execute(verb, meta) (data, meta) =>
        callback data, meta
  
  remove: (bucket, key, options) ->
    (callback) =>
      options or= {}
      meta = new Meta bucket, key, options
      @execute('DELETE', meta) (data, meta) =>
        callback data, meta

  map: (phase, args) ->
    new Mapper this, 'map', phase, args

  reduce: (phase, args) ->
    new Mapper this, 'reduce', phase, args

  link: (phase) ->
    new Mapper this, 'link', phase
    
  runJob: (options) ->
    (callback) =>
      options.raw = 'mapred'
      @save('', '', options.data, options)(callback)

  ping: ->
    (callback) =>
      options = raw: 'ping'
      meta = new Meta '', '', options
      @execute('HEAD', meta) (data, meta) =>
        callback true, meta
  
  end: ->
    @pool.end()
        
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
      headers = meta.toHeaders()
      
      @log "#{verb} #{path}"
     
      ##
      
      if verb isnt 'GET'
        headers.Connection = 'close'
          
      @pool.request verb, path, headers, (request) =>

        if meta.data
          request.write meta.encode(meta.data), meta.contentEncoding
          delete meta.data
        
        buffer = new String

        request.on 'response', (response) ->
          response.on 'data', (chunk) -> buffer += chunk
          response.on 'end', =>
            meta = meta.loadHeaders response.headers, response.statusCode
            buffer = meta.decode(buffer) if buffer.length > 0
            if meta.statusCode is 404 then buffer = undefined # to be in sync with pbc
            callback buffer, meta
            
        request.end()

  # http client utils

  stringifyQuery: (query) ->
    for key, value of query
      query[key] = String(value) if typeof value is 'boolean' # stringify booleans
    querystring.stringify(query)
    

class Meta extends CoreMeta
  
  mappings:
    contentType: 'content-type'
    vclock: 'x-riak-vclock'
    lastMod: 'last-modified'
    etag: 'etag' # but send ['If-None-Match'] if etag present!
    links: 'link'
    host: 'host'
    clientId: 'x-riak-clientid'

  loadHeaders: (headers, statusCode) ->
    options = {}
    for k,v of @mappings when v
      if v is 'link'
        options[k] = @stringToLinks headers[v]
      else
        options[k] = headers[v]

    # load destroys usermeta, so pass it in again
    @load Utils.mixin true, @usermeta, options
    @statusCode = statusCode
    
    return this
    
  toHeaders: () ->
    headers = {}
    for k,v of @mappings
      if k is 'links'
        headers[v] = @linksToString()
      else
        headers[v] = this[k] if this[k]

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