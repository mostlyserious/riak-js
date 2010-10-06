CoreMeta = require './meta'
Utils = require './utils'

class Meta extends CoreMeta
  
  # HTTP header mappings
  
  requestMappings:
    accept: 'accept' # mix in default
    host: 'host' # mix in default
    clientId: 'x-riak-clientid' # mix in default
    vclock: 'x-riak-vclock'
    lastMod: 'If-Modified-Since' # check possible bug with these
    etag: 'If-None-Match' # check possible bug with these
    links: 'link'
    contentType: 'content-type' # only if sending body
    
    # other request info
    # bucket, key, usermeta (X-Riak-Meta-*)
    
    # other not sent info: binary, raw, url, path (url and path are the same!!!)
    # queryProps, queryString -- check out these
    
  responseMappings:
    'content-type': 'contentType' # binary depends on the contentType
    'x-riak-vclock': 'vclock'
    'last-modified': 'lastMod'
    'etag': 'etag'
    'link': 'links'
    
    # other response info
    # statusCode, X-Riak-Meta-* (=> usermeta), Location (=> key)
    
    # other ignored info: Vary, Server, Date, Content-Length, Transfer-Encoding
  
  load: (options) ->
    
    super options, Meta.riakProperties.concat(Meta.queryProperties) # hmmm
    
    queryProps = {}
    Meta.queryProperties.forEach (prop) => queryProps[prop] = this[prop] if this[prop]?

    queryString = @stringifyQuery queryProps

    @path = "/#{@raw}/#{@bucket}/#{@key or ''}#{if queryString then '?' + queryString else ''}"
  
  
  loadResponse: (response) ->
    headers = response.headers
    @statusCode = response.statusCode
    
    for k,v of @mappings
      if v is 'link'
        this[k] = @stringToLinks headers[v]
      else
        this[k] = headers[v]
        
    for k,v of headers
      u = k.match /^X-Riak-Meta-(.*)/i
      @usermeta[u[1]] = v if u

    # load destroys usermeta, so pass it in again
    # @load Utils.mixin true, {}, @usermeta, options
    
    return this
    
  toHeaders: ->
    headers =
      Accept: "multipart/mixed, application/json;q=0.7, */*;q=0.5" # default accept header
    
    for k,v of @mappings
      if k is 'links'
        headers[v] = @linksToString()
      else
        headers[v] = this[k] if this[k]
    
    for k,v of @usermeta then headers["X-Riak-Meta-#{k}"] = v

    # headers['If-None-Match'] = @etag if @etag # buggy, check

    return headers
    
  ## private
    
  stringToLinks: (links) ->
    result = []
    if links
      links.split(',').forEach (link) ->
        captures = link.trim().match /^<\/(.*)\/(.*)\/(.*)>;\sriaktag="(.*)"$/
        if captures
          for i of captures then captures[i] = decodeURIComponent(captures[i])
          result.push new Link({bucket: captures[2], key: captures[3], tag: captures[4]})
    result
    
  linksToString: ->
    @links.map((link) => "</#{@raw}/#{link.bucket}/#{link.key}>; riaktag=\"#{link.tag || "_"}\"").join ", "

    # typical Riak querystring properties
    # props=[true|false]
    # keys=[true|false|stream]
    # r, w, dw, rw
    # vtag (the sibling's etag)
    # returnbody=[true|false]
    # chunked=[true|false]
    
Meta.queryProperties = ['r', 'w', 'dw', 'rw', 'keys', 'props', 'vtag', 'returnbody', 'chunked']

Meta.riakProperties = [
  'statusCode' # http
  'host' # http only
]

class Link
  
  constructor: (options) ->
    @bucket = options.bucket
    @key = options.key
    @tag = options.tag
    
module.exports = Meta