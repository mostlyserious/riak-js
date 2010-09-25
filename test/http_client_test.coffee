test = require('./helper') 'http'
calls = 0
bucket = 'riakjs_http'

HTTP_TEST_DATA = {}
HTTP_TEST_DATA[bucket] =
  'test1': [{name: 'Testing 1'}]
  'test2': [{name: 'Testing 2'}]

LOAD test.api, HTTP_TEST_DATA, ->

  test (db, end) ->
    calls += 1
    db.count bucket, (err, elems) ->
      [count] = elems
      assert.ok count, 2

  test (db, end) ->
    calls += 1
    db.head bucket, 'test1', (err, data, meta) ->
      assert.equal data, undefined

  test (db, end) ->
    calls += 1
    db.keys bucket, (err, keys) ->
      assert.deepEqual ['test1', 'test2'], keys.sort()
    
  test (db, end) ->
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
  total = 4
  assert.equal calls, total, "#{calls} out of #{total} http-specific client tests"