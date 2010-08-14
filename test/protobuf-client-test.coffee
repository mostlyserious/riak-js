test  = require('./helper') 'protobuf'
calls = 0

# Doing crappy sys.puts debugging until enough of the api is fleshed out
# to actually insert fixture data and do some actual tests :)
test (db, end) ->
  db.get('airlines', 'KLM') (flight, meta) ->
    calls += 1
    sys.puts "#{meta.bucket}/#{meta.key}: #{sys.inspect(flight)}"
    end()

test (db, end) ->
  db.save('airlines', 'KVM', {alliance: 'foobar', fleet: 222}, returnBody: true) (flight, meta) ->
    calls += 1
    sys.puts "#{meta.bucket}/#{meta.key}: #{sys.inspect(flight)}"
    end()

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

# looks like the save() call and keys() call are killing each other
#test (db, end) ->
#  db.keys('airlines') (keys) ->
#    calls += 1
#    sys.puts sys.inspect(keys)
#    end()

process.on 'exit', ->
  assert.equal 5, calls