vows = require 'vows'
assert = require 'assert'
Meta = require '../src/meta'

full = {}

vows.describe('Meta').addBatch(

  'an empty meta':
    topic: ->
      new Meta 'bucket', 'empty'
    
    'has its basic properties set': (empty) ->
      assert.equal 'bucket',           empty.bucket
      assert.equal 'empty',            empty.key
      assert.equal null,               empty.vclock
      assert.equal false,              empty.binary
    
    'falls back to defaults from non-set properties': (empty) ->
      assert.deepEqual empty.links, Meta.defaults.links
      assert.equal empty.raw, Meta.defaults.raw
      assert.equal empty.clientId, Meta.defaults.clientId
      assert.equal empty.host, Meta.defaults.host
      
  'a full meta':
    topic: ->
      full = new Meta 'bucket', 'full'
        contentType: 'png'
        data: 'd32n92390XMIW0'
        vclock:      123
        custom:      'abc'
      # calling encodeData() resolves to the correct content type and binary state
      full.encodeData()
      full
    
    'has its basic properties set': (full) ->
      assert.equal 'bucket',    full.bucket
      assert.equal 'full',      full.key
      assert.equal 123,         full.vclock
      assert.equal 'image/png', full.contentType
      assert.equal 'abc',       full.usermeta.custom
      assert.equal true,        full.binary
      
    'can be updated': (full) ->
      full.contentType = 'xml'
      full.data = "<a>test</a>"
      full.encodeData()
      assert.equal 'text/xml', full.contentType
      assert.equal false,      full.binary
      
  'a keyless meta':
    topic: ->
      keyless = new Meta 'bucket'
      
      keyless.addLink { bucket: 'bucket', key: 'test' }
      keyless.addLink { bucket: 'bucket', key: 'test2', tag: '_' }
      keyless.addLink { bucket: 'bucket', key: 'test', tag: 'tag' }
      
      # dupes
      keyless.addLink { bucket: 'bucket', key: 'test' }
      keyless.addLink { bucket: 'bucket', key: 'test', tag: 'tag' }
      keyless.addLink { bucket: 'bucket', key: 'test2', tag: '_' }
      keyless.addLink { bucket: 'bucket', key: 'test2' } # no tag or '_' are equivalent
      
      keyless.data = 'some text'
      keyless.encodeData()
      
      keyless
      
    'hasn\'t got a key': (keyless) ->
      assert.equal undefined, keyless.key
    
    'usermeta is empty': (keyless) ->
      assert.deepEqual {}, keyless.usermeta
      
    'data is plain text': (keyless) ->
      assert.equal keyless.contentType, 'text/plain'
    
    'duplicate links are ignored': (keyless) ->
      assert.deepEqual keyless.links, [
        { bucket: 'bucket', key: 'test' }
        { bucket: 'bucket', key: 'test2', tag: '_' }
        { bucket: 'bucket', key: 'test', tag: 'tag' }
      ]
    
    'links can be removed': (keyless) ->
      keyless.removeLink { bucket: 'bucket', key: 'test' }
      assert.equal keyless.links.length, 2
      keyless.removeLink { bucket: 'bucket', key: 'test', tag: 'tag' }
      assert.equal keyless.links.length, 1
      keyless.removeLink { bucket: 'bucket', key: 'test2' } # should treat tag '_' as non-existent
      assert.equal keyless.links.length, 0
      
  'a meta provided with a Javascript object as data':
    topic: ->
      meta = new Meta 'bucket', 'key', {
        data: {a: 1, b: 2}
      }
      meta.encodeData()
      meta
    
    'has content type json when encoded': (meta) ->
      assert.equal meta.contentType, "application/json"

).export module