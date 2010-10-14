assert = require 'assert'
Meta   = require '../src/http_meta'

# test path

keyed = new Meta 'bucket', 'key'
assert.equal "/riak/bucket/key", keyed.path

# test loadResponse/toHeaders

# we receive this response from riak
riakResponse =
  httpVersion: '1.1'
  headers: 
    vary: 'Accept-Encoding'
    server: 'MochiWeb/1.1 WebMachine/1.7.1 (participate in the frantic)'
    'x-riak-vclock': 'a85hYGBgzGDKBVIsbLvm1WYwJTLmsTLcjeE5ypcFAA=='
    'x-riak-meta-acl': 'users:r,administrators:f'
    link: '</riak/test>; rel="up", </riak/test/doc%252%24%40>; riaktag="next"'
    'last-modified': 'Wed, 10 Mar 2010 18:11:41 GMT'
    etag: '6dQBm9oYA1mxRSH0e96l5W'
    date: 'Wed, 10 Mar 2010 18:11:52 GMT'
    'content-type': 'text/rtf'
    'content-length': '2946'    
  statusCode: 200

resp_meta = new Meta { bucket: 'bucket', key: 'key' }
resp_meta.loadResponse riakResponse

assert.deepEqual resp_meta.usermeta, { acl: 'users:r,administrators:f' }
assert.equal resp_meta.statusCode, 200
assert.equal resp_meta.date, undefined
assert.equal new Date(resp_meta.lastMod).getTime(), 1268244701000
assert.deepEqual resp_meta.links, [{ bucket: 'test', key: 'doc%2$@', tag: 'next' }]
assert.equal resp_meta.contentType, 'text/rtf'

resp_meta.usermeta.fire = true

# now we want to push it back to riak
requestHeaders = resp_meta.toHeaders()

assert.notEqual requestHeaders.statusCode?
assert.equal resp_meta.path, '/riak/bucket/key'
assert.equal requestHeaders['X-Riak-Meta-fire'], 'true'
assert.equal requestHeaders['Link'], '</riak/test/doc%252%24%40>; riaktag="next"'

##

# location
riakPostResponse =
  headers:
    location: '/riak/test/bzPygTesROPtGGVUKfyvp2RR49' 
  statusCode: 201

location_meta = new Meta
location_meta.loadResponse riakPostResponse

assert.equal location_meta.bucket, 'test'
assert.equal location_meta.key, 'bzPygTesROPtGGVUKfyvp2RR49'
assert.equal location_meta.statusCode, 201

# put request
put_meta = new Meta 'bucket', 'aput'
put_meta.data = { test: true }

put_headers = put_meta.toHeaders()
assert.equal put_headers['Content-Type'], 'application/json'
assert.equal put_headers['Link'], undefined

# query properties

assert.deepEqual ['r', 'w', 'dw', 'rw', 'keys', 'props', 'vtag', 'returnbody', 'chunked'], Meta.queryProperties

queryProps =
  bucket: 'bucket'
  key: 'key'
  r: 1
  w: 2
  dw: 2
  rw: 2
  keys: true
  props: false
  vtag: 'asweetvtag'
  returnbody: true
  chunked: true

withQueryProps = new Meta queryProps
assert.equal "/riak/bucket/key?r=1&w=2&dw=2&rw=2&keys=true&props=false&vtag=asweetvtag&returnbody=true&chunked=true", withQueryProps.path