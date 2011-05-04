CoreMeta = require './meta'

class Meta extends CoreMeta
  
  load: (options) ->
    super options, Meta.riakProperties.concat(Meta.queryProperties), Meta.defaults, CoreMeta.defaults

  loadResponse: (response) =>
    
    if response?.content
      for k,v of response.content[0] when k in CoreMeta.riakProperties
        @[k] = v.toString()
        
      # TODO handle the equivalent of HTTP multiple choices
      
      @response = try
        @decode(response.content[0].value)
      catch e
        new Error "Cannot convert response into #{@contentType}: #{e.message} -- Response: #{response.content.value}"
        
    else
      # special case for Not Found, the rest should go through RpbErrorResp
      err = new Error('Not Found')
      err.notFound = true
      @response = undefined
    
    # # links
    # if headers.link then @links = linkUtils.stringToLinks headers.link
    # 
    # # etag -- replace any quotes in the string
    # if headers.etag then @etag = headers.etag.replace /"/g, ''

    return this

  encodeLinks: (links) ->
    if links
      if not Array.isArray(links) then links = [links]
      return links

  encodeUsermeta: (data) ->
    for key, value of data then { key: key, value: value }

# Adds a RpbContent structure, see RpbPutReq for usage.
Meta::__defineSetter__ 'data', (data) ->
  @content = 
    value: @encode(data)
    contentType: @contentType
    charset: @charset
    contentEncoding: @contentEncoding
    links: @encodeLinks(@links)
    usermeta: @encodeUsermeta(@usermeta)

  delete @usermeta
  delete @links
    
module.exports = Meta