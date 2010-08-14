test  = require('./helper') 'protobuf'
calls = 0

test (db, end) ->
  db.ping() (data) ->
    calls += 1
    assert.equal true, data
    end()

test (db, end) ->
  db.serverInfo() (data) ->
    calls += 1
    assert.equal 'riak@127.0.0.1', data.node
    assert.ok data.serverVersion.match(/\d+\.\d+/)
    end()

LOAD 'protobuf', RIAKJS_CLIENT_TEST_DATA, ->
  test (db, end) ->
    db.buckets() (buckets) ->
      calls += 1
      assert.deepEqual [
          'riakjs_airlines'
          'riakjs_airports'
          'riakjs_flights'
        ], buckets.sort()
      end()

  test (db, end) ->
    db.get('riakjs_airlines', 'KLM') (air, meta) ->
      calls += 1
      assert.equal 'riakjs_airlines',  meta.bucket
      assert.equal 'KLM',              meta.key
      assert.equal 'application/json', meta.contentType
      assert.equal 111,                air.fleet
      assert.ok meta.vclock?
      end()

  # looks like the save() call and keys() call are killing each other
  test (db, end) ->
    db.keys('riakjs_airports') (keys) ->
      calls += 1
      assert.equal 'AMS', keys.sort()[0]
      end()

process.on 'exit', ->
  assert.equal 5, calls