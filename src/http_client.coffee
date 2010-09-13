Client   = require './client'
CoreMeta     = require './meta'
Mapper = require './mapper'
Utils    = require './utils'
HttpPool = require './http_pool'
querystring = require 'querystring'

class HttpClient extends Client
  constructor: (options) ->
    @defaults =
      port: 8098
      host: 'localhost'
      clientId: 'riak-js'  # fix default clientId
      host: @options?.host or 'localhost'
      debug: true
      callback: (response, meta) =>
          @log response, { json: meta?.contentType is 'application/json'}
    
    @defaults = Utils.mixin {}, @defaults, options
    @pool or= HttpPool.createPool @defaults.port, @defaults.host
    
    delete @defaults.host
    delete @defaults.port
    
  log: (string, options) ->
    options or= {}
    if string
      string = JSON.stringify string if options.json
      console.log string if console and (@defaults.debug or options.debug)
      
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
      options = { raw: 'ping' }
      meta = new Meta '', '', options
      @execute('HEAD', meta) (data, meta) =>
        callback true, meta
  
  end: ->
    @pool.end()
        
  # private
  
  execute: (verb, meta) ->
    
    (callback) =>
    
      url = "/#{meta.raw}/#{meta.bucket}/#{meta.key or ''}"
      options = Utils.mixin true, {}, @defaults, meta.usermeta
      verb = verb.toUpperCase()
      queryProps = {}
      
      ['r', 'w', 'dw', 'keys', 'props', 'vtag', 'nocache', 'returnbody'].forEach (prop) ->
        queryProps[prop] = options[prop] unless options[prop] is undefined
      
      query = @stringifyQuery queryProps
      path = "#{url}#{if query then '?' + query else ''}"
      callback = callback or @defaults.callback
      
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
            # this logic should belong to our custom Meta?
            meta.load meta.convertOptions(response.headers)
            meta.statusCode = response.statusCode
            
            buffer = meta.decode(buffer) if buffer.length > 0
            if meta.statusCode is 404 then buffer = undefined # to be sync with pbc
            
            callback buffer, meta
            
        request.end()

  # http client utils

  stringifyQuery: (query) ->
    for key, value of query
      query[key] = String(value) if typeof value is 'boolean' # stringify booleans
    querystring.stringify(query)
    

class Meta extends CoreMeta

  # to be only used in execute / deserialize
  convertOptions: (options) ->
    return {} unless options
    options.contentType = options['content-type']
    options.vclock = options['x-riak-vclock']
    options.lastMod = options['last-modified']
    options.links = @stringToLinks options['link']
    # and others
    options
    
  toHeaders: () ->
    # defaults should go somewhere else
    headers =
      'Host': @usermeta.host or 'localhost'
      'content-type': @contentType
      'If-None-Match': @etag
      'If-Modified-Since': @lastMod
      # merge links *already* set in the header (as not to overwrite them)
      'link': @linksToString()
      
    if headers['X-Riak-Vclock'] then headers['X-Riak-ClientId'] = meta.clientId or 'riak-js'
    
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