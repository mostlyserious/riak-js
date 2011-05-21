vows = require 'vows'
assert = require 'assert'
Meta = require '../src/http_meta'

full = {}

vows.describe('Meta for HTTP').addBatch(

  'a meta with a key':
    topic: ->
      new Meta 'bucket', 'key'
    
    'gives back its HTTP path': (keyed) ->
      assert.equal "/riak/bucket/key", keyed.path

  'a meta loaded with a Riak response':
    topic: ->
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

      meta = new Meta { bucket: 'bucket', key: 'key' }
      meta.loadResponse riakResponse
      meta
    
    'parses correctly from HTTP headers': (meta) ->
      assert.deepEqual meta.usermeta, { acl: 'users:r,administrators:f' }
      assert.equal meta.statusCode, 200
      assert.equal meta.date, undefined
      assert.equal new Date(meta.lastMod).getTime(), 1268244701000
      assert.deepEqual meta.links, [{ bucket: 'test', key: 'doc%2$@', tag: 'next' }]
      assert.equal meta.contentType, 'text/rtf'
      assert.equal meta.path, '/riak/bucket/key'

  'a meta with some properties and headers':
    topic: ->
      meta = new Meta 'bucket', 'key', {
        links: [{ bucket: 'test', key: 'doc%2$@', tag: 'next' }]
        fire: true
        overridable: true
        headers: { Authorization: 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==', 'X-Riak-Meta-overridable': 'yes!' }
      }
      meta.toHeaders()
    
    'parses them correctly': (headers) ->
      assert.notEqual headers.statusCode?
      assert.equal headers['X-Riak-Meta-fire'], 'true'
      assert.equal headers['Link'], '</riak/test/doc%252%24%40>; riaktag="next"'
    
    'overrides them correctly': (headers) ->
      assert.equal headers['X-Riak-Meta-overridable'], 'yes!'
      assert.equal headers['Authorization'], 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ=='
      
  'a meta partly loaded with POST response headers':
    topic: ->
      riakPostResponse =
        headers:
          location: '/riak/test/bzPygTesROPtGGVUKfyvp2RR49' 
        statusCode: 201
      
      meta = new Meta
      meta.loadResponse riakPostResponse
      meta
    
    'returns its location and status code': (meta) ->
      assert.equal meta.bucket, 'test'
      assert.equal meta.key, 'bzPygTesROPtGGVUKfyvp2RR49'
      assert.equal meta.statusCode, 201
      
  'a meta with JSON data':
    topic: ->
      meta = new Meta 'bucket', 'json-data'
      meta.data = { test: true }
      meta.toHeaders()
    
    'guesses its content-type': (headers) ->
      assert.equal headers['Content-Type'], 'application/json'
      assert.equal headers['Link'], undefined
      
  'a meta without a vclock':
    topic: ->
      meta = new Meta 'bucket', 'test'
      meta.toHeaders()
      
    'does not send a clientId header': (headers) ->
      assert.isUndefined headers['X-Riak-ClientId']      

  'a meta with responseEncoding=binary':
    topic: ->
      new Meta 'bucket', 'binary-data', {
        data: new Buffer('binary-data')
        responseEncoding: 'binary'
      }

    'recognizes it as a first-class property': (meta) ->
      assert.equal meta.responseEncoding, 'binary'

  'a meta with query properties':
    topic: ->
      new Meta {
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
      }
    
    'knows how to create its HTTP path': (meta) ->
      assert.equal "/riak/bucket/key?r=1&w=2&dw=2&rw=2&keys=true&props=false&vtag=asweetvtag&returnbody=true&chunked=true", meta.path
      
  'a Meta that encodes its URI components':
    topic: ->
      new Meta {
        bucket: 'spåce bucket'
        key: 'çøµπléx–key'
        encodeUri: true
      }
      
    'should have a URI encoded path': (meta) ->
      assert.equal "/riak/sp%C3%A5ce%20bucket/%C3%A7%C3%B8%C2%B5%CF%80l%C3%A9x%E2%80%93key", meta.path

).export module