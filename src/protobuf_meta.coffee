CoreMeta = require './meta'

class Meta extends CoreMeta
  
  load: (options) ->
    super options #, Meta.riakProperties
  
  # Adds a RpbContent structure, see RpbPutReq for usage.
  withContent: (body) ->
    @content = 
      value:           @encode body
      contentType:     @contentType
      charset:         @charset
      contentEncoding: @contentEncoding
      links:           @encodeLinks   @links
      usermeta:        @encodeUsermeta @usermeta

    delete @usermeta
    delete @links
    this

  encodeLinks: (links) ->
    parsed = []
    if links and not Array.isArray(links)
      links = [links]
    links.forEach (link) ->
      parsed.push link
    parsed

  encodeUsermeta: (data) ->
    parsed = []
    for all key, value of data
      parsed.push key: key, value: value
    parsed
    
module.exports = Meta