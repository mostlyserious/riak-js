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
    calls += 1
    db.updateProps bucket, { n_val: 8, allow_mult: true }, ->
    db.getProps bucket, (err, resp) ->
      assert.equal resp.props.n_val, 8

  test (db) ->
    calls += 1
    db.count bucket, (err, elems) ->
      [count] = elems
      assert.equal count, 2

  test (db) ->
    calls += 1
    db.head bucket, 'test1', (err, data, meta) ->
      assert.equal data, undefined

  test (db) ->
    calls += 1
    db.keys bucket, (err, keys) ->
      assert.deepEqual ['test1', 'test2'], keys.sort()
      
  test (db) ->
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
    
  test (db) ->
    calls += 1
    db.getAll bucket, withId: true, (err, elems) ->
      assert.equal elems.length, 2
      [[key, { name: name }]] = elems
      assert.ok key.match(/^test/)
      assert.ok name.match(/^Testing/)

    db.keys bucket, (err, keys) ->
      for key in keys then db.remove bucket, key, (err, resp, meta) ->
        assert.equal meta.statusCode, 204

require('./core_riak_tests') test

process.on 'exit', ->
  total = 5
  message = "#{calls} out of #{total} http-specific client tests"
  assert.equal calls, total, message
  console.log message