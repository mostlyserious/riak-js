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
  
  test (db, end) ->
    db.get('riakjs_flights', 'IBE_4418') (flight) ->
      assert.equal 'JFK', flight.from
  
      db.remove('riakjs_flights', 'IBE_4418') (data) ->
        assert.ok data
  
        db.get('riakjs_flights', 'IBE_4418') (flight) ->
          assert.equal undefined, flight
          calls += 1
          end()

  test (db, end) ->
    db.
      map(
        (value) ->
          this.should.raise.something
      ).
      run('riakjs_airlines') (response) ->
        calls += 1
        assert.ok response.message?
        assert.ok response.errcode?
        end()

  test (db, end) ->
    db.
      map('Riak.mapValuesJson').
      reduce(
        (values) ->
          values.reduce (acc, value) ->
            acc + value.fleet
          , 0
      ).
      run('riakjs_airlines') (response) ->
        calls += 1
        assert.equal 1029, response[1]
        end()

  test (db, end) ->
    db.keys('riakjs_airports') (keys) ->
      calls += 1
      assert.equal 8,     keys.length
      assert.equal 'AMS', keys.sort()[0]
      end()
  
process.on 'exit', ->
  assert.equal 8, calls