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

test (db, end) ->
  db.buckets() (buckets) ->
    calls += 1
    sys.puts sys.inspect(buckets)
    end()

test (db, end) ->
  db.keys('airlines') (keys) ->
    calls += 1
    sys.puts sys.inspect(keys)
    end()

process.on 'exit', ->
  assert.equal 4, calls