test = require('./helper') 'http'
calls = 0
bucket = 'riakjs_http'
assert = require 'assert'

HTTP_TEST_DATA = {}
HTTP_TEST_DATA[bucket] =
  'test1': [{name: 'Testing 1'}]
  'test2': [{name: 'Testing 2'}]

LOAD test.api, HTTP_TEST_DATA, ->

  test (db) ->

    db.getProps bucket, (err, resp) ->
      assert.equal resp.props.allow_mult, false

    db.count bucket, (err, elems) ->
      [count] = elems
      assert.equal count, 2

    db.head bucket, 'test1', (err, data, meta) ->
      assert.equal data, undefined

    db.keys bucket, (err, keys) ->
      assert.deepEqual ['test1', 'test2'], keys.sort()
      
    # test updates
    db.save bucket, 'test3', {name: 'Testing 3'}
    
    db.get bucket, 'test3', (err, data) ->
      data.updated = true
      data.wtf = 'yes'
      data.wee = 42
      db.save bucket, 'test3', data
    
      db.get bucket, 'test3', (err, data) ->
        assert.ok data.updated
        assert.equal data.wtf, 'yes'
        assert.equal data.wee, 42 
  
    db.updateProps bucket, { n_val: 8, allow_mult: true }, ->
    db.getProps bucket, (err, resp) ->
      assert.equal resp.props.n_val, 8
      assert.ok resp.props.allow_mult
    
    db.save bucket, 'test1', {name: 'Testing conflicting'}
    db.get bucket, 'test1', (err, data, meta) ->
      # conflicting versions returned
      assert.equal data.length, 2
      # now we pick the one with name 'Testing conflicting'
      # and save (meta bundles the correct vclock)
      [resolved] = data.filter (e) -> e.data.name is 'Testing conflicting'
      db.save bucket, 'test1', resolved.data, resolved.meta
      db.get bucket, 'test1', (err, data) ->
        # we now get the object with name 'Testing conflicting'
        assert.equal !!data.length, false
        assert.equal data.name, 'Testing conflicting'
    
    db.getAll bucket, where: { name: 'Testing 2', other: undefined }, (err, elems) ->
      assert.equal elems.length, 1
    
    db.getAll bucket, (err, elems) ->
      assert.equal elems.length, 3
      [{ meta: { key: key }, data: { name: name }}] = elems
      assert.ok key.match /^test/
      assert.ok name.match /^Testing/
      
    db.updateProps bucket, allow_mult: false, ->

    db.save bucket, 'test-buffer', new Buffer('hello')
    db.get bucket, 'test-buffer', (err, data) ->
      assert.equal 'hello', data.toString()
    db.remove bucket, 'test-buffer'

    for b in [bucket, 'riakjs_airlines', 'riakjs_airports', 'riakjs_flights']
      db.keys b, (err, keys) ->
        for key in keys then db.remove b, key, (err, resp, meta) ->
          assert.equal meta.statusCode, 204

require('./core_riak_tests') test

process.on 'exit', ->
  console.log "Tests completed"