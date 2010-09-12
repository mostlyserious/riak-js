Client   = require './client'
CoreMeta     = require './meta'
Utils    = require './utils'
HttpPool = require './http_pool'
p = require('sys').p

class HttpClient extends Client
  constructor: (options) ->
    @defaults =
      port: 8098
      host: 'localhost'
      clientId: 'riak-js'  # fix default clientId
      method: 'GET'
      interface: 'riak'
      headers:
        'Host': @options?.host or 'localhost'
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
    
  get: (bucket, key, options) ->
    (callback) =>
      meta = new Meta bucket, key, options
      @execute(meta) (data, meta) =>
        callback data, meta
  
  save: (bucket, key, data, options) ->
    (callback) =>
      [data, options] = [data or {}, options or {}]
      if not options.method
        options.method = if key then 'PUT' else 'POST'
      
      meta = new Meta bucket, key, options
      meta.content = 
        value:           meta.encode data
        contentType:     meta.contentType
        charset:         meta.charset
        contentEncoding: meta.contentEncoding
        # links
        # usermeta
      @execute(meta) (data, meta) =>
        callback data, meta
  
  remove: (bucket, key, options) ->
    (callback) =>
      options or= {}
      options.method = 'DELETE'
      meta = new Meta bucket, key, options
      @execute(meta) (data, meta) =>
        callback data, meta

  map: (phase, args) ->
    new Mapper this, 'map', phase, args

  reduce: (phase, args) ->
    new Mapper this, 'reduce', phase, args

  link: (phase) ->
    new Mapper this, 'link', phase
    
  ping: ->
    (callback) =>
      options = { interface: 'ping', method: 'head' }
      meta = new Meta '', '', options
      @execute(meta) (data, meta) =>
        callback meta.statusCode, meta
  
  end: ->
    @pool.end()
        
  # private
  
  execute: (meta) ->
    
    (callback) =>
    
      url = Utils.path meta.bucket, meta.key
      options = Utils.mixin true, {}, @defaults, meta.usermeta
      # p options
      query = null #  var query = utils.toQuery(queryProperties, self);
      path = "/#{options.interface}/#{url}#{if query then '?' + query else ''}"
      callback = callback or @defaults.callback
    
      # set headers
      options.headers =
        Host: 'localhost'
        'content-type': meta.contentType
        'If-None-Match': options.etag
        'If-Modified-Since': options.lastModified
        
      if options.headers['X-Riak-Vclock']
        options.headers['X-Riak-ClientId'] = options.clientId
      
      # handle links, merging those set in the header with those set via the shortcut
      # if Utils.isArray options.links
      #   hl = if options.headers.link then ", #{options.headers.link}" else ""
      #   options.headers.link = new Meta({}, self.defaults.interface).makeLinks(options.links) + hl
      
      # include query properties / riakProperties
     
      @log "#{options.method.toUpperCase()} #{path}"
     
      ##
      
      if meta?.content?.value
        options.headers.Connection = 'close'
          
      @pool.request options.method.toUpperCase(), path, options.headers, (request) =>

        if meta?.content?.value
          request.write meta.content.value, meta.contentEncoding

        buffer = new String

        request.on 'response', (response) ->
          response.on 'data', (chunk) -> buffer += chunk
          response.on 'end', =>
            meta = new Meta '', '', response.headers
            meta.contentType = response.headers['content-type']
            meta.statusCode = response.statusCode
            buffer = if buffer is not '' then meta.decode(buffer) else buffer
            callback buffer, meta
            
        request.end()

class Meta extends CoreMeta
  
  constructor: (bucket, key, options) ->
    super bucket, key, @convertOptions options
    
  convertOptions: (options) ->
    return {} unless options
    options.contentType = options['content-type']
    options.vclock = options['x-riak-vclock']
    options.lastMod = options['last-modified']
    # build links
    # and others
    options

module.exports = HttpClient