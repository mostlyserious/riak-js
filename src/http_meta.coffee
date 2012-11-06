CoreMeta = require './meta'
Utils = require './utils'

class Meta extends CoreMeta

  load: (options) ->
    super options, Meta.riakProperties.concat(Meta.queryProperties), Meta.defaults, CoreMeta.defaults

  # HTTP response header mappings

  responseMappings:
    'content-type': 'contentType' # binary depends on the contentType
    'x-riak-vclock': 'vclock'
    'last-modified': 'lastMod'
    'content-range': 'contentRange'
    'accept-ranges': 'acceptRanges'
    'date': 'date'

    # other response info:
    # statusCode, X-Riak-Meta-* (=> usermeta), link (=> links) Location (=> key)
    # ignored headers: Vary, Server, Content-Length, Transfer-Encoding

  loadResponse: (response) ->
    headers = response.headers

    # one-to-one
    for v,k of @responseMappings then this[k] = headers[v]

    # status code
    @statusCode = response.statusCode

    # usermeta
    for k,v of headers
      u = k.match /^X-Riak-Meta-(.*)/i
      @usermeta[u[1]] = v if u

    # links
    if headers.link then @links = linkUtils.stringToLinks headers.link

    # etag -- replace any quotes in the string
    if headers.etag then @etag = headers.etag.replace /"/g, ''

    # location
    if headers.location
      [$0, @raw, @bucket, @key] = headers.location.match /^\/([^\/]+)(?:\/([^\/]+))?\/([^\/]+)$/

    # delete method used in previous request
    delete @method

    return this

  # HTTP request header mappings

  requestMappings:
    accept: 'Accept'
    host: 'Host'
    clientId: 'X-Riak-ClientId'
    vclock: 'X-Riak-Vclock'
    range: 'Range'
    connection: 'Connection'
    # lastMod: 'If-Modified-Since' # check possible bug with these
    # etag: 'If-None-Match' # check possible bug with these

    # other request info:
    # usermeta (X-Riak-Meta-*), links, contentType
    # ignored info: binary, raw, url, path

  toHeaders: ->

    headers = {}

    # remove client id if there's no vclock
    delete @requestMappings.clientId unless this.vclock?

    for k,v of @requestMappings then headers[v] = this[k] if this[k]

    # 2i
    for k,v of @index
      type = if typeof v is 'number' then 'int' else 'bin'
      headers["X-Riak-index-#{k}_#{type}"] = v

    # usermeta
    for k,v of @usermeta then headers["X-Riak-Meta-#{k}"] = String(v)

    # links
    headers['Link'] = linkUtils.linksToString(@links, @raw) if @links.length > 0

    if @data?

      # now we need to encode the data to calculate its type and length
      @encodeData()

      # contentType
      headers['Content-Type'] = @contentType

      # don't send chunked data at least until riak #278 gets fixed or we can stream the req body
      headers['Content-Length'] = @data.length

    if @headers
      for k of @headers then headers[k] = @headers[k]
      delete @headers

    return headers

  doEncodeUri: (component = '') ->
    if @encodeUri
      encodeURIComponent component.replace /\+/g, "%20"
    else
      component

Meta::__defineGetter__ 'path', ->
  queryString = @stringifyQuery @queryProps
  bq = if @bucket then "/#{@doEncodeUri @bucket}" else ''
  kq = if @key then "/#{@doEncodeUri @key}" else ''
  qs = if queryString then "?#{queryString}" else ''
  "/" + @raw + bq + kq + qs

Meta::__defineGetter__ 'queryProps', ->
  queryProps = {}
  Meta.queryProperties.forEach (prop) => queryProps[prop] = this[prop] if this[prop]?
  queryProps

Meta.defaults =
  host: 'localhost'
  port: 8098
  accept: 'multipart/mixed, application/json;q=0.7, */*;q=0.5'
  responseEncoding: 'utf8'

Meta.queryProperties = [
  'r'
  'w'
  'dw'
  'rw'
  'keys'
  'props'
  'vtag'
  'returnbody'
  'chunked'
  'buckets'
  'q' # search
  'start' # search
  'rows' # search
  'wt' # search
  'sort' # search
  'presort' # search
  'filter' # search
  'fl' #search
]

Meta.riakProperties = ['statusCode', 'host', 'responseEncoding', 'noError404', 'index']

module.exports = Meta

# private

linkUtils =
  stringToLinks: (links) ->
    result = []
    if links
      links.split(',').forEach (link) ->
        captures = link.trim().match /^<\/([^\/]+)\/([^\/]+)\/([^\/]+)>;\sriaktag="(.+)"$/
        if captures
          for i of captures then captures[i] = decodeURIComponent(captures[i])
          result.push { bucket: captures[2], key: captures[3], tag: captures[4] }
    result

  linksToString: (links, raw) ->
    links.map((link) => "</#{raw}/#{encodeURIComponent link.bucket}/#{encodeURIComponent link.key}>; riaktag=\"#{encodeURIComponent link.tag || "_"}\"").join ", "
