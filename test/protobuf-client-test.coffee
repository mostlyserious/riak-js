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

# Doing crappy sys.puts debugging until enough of the api is fleshed out
# to actually insert fixture data and do some actual tests :)
test (db, end) ->
  db.get('airlines', 'KLM') (flight, meta) ->
    calls += 1
    sys.puts sys.inspect(flight)
    sys.puts sys.inspect(meta)
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
  assert.equal 5, calls