test = require('./helper') 'protobuf'
calls = 0

test (db, end) ->
  db.serverInfo (err, data) ->
    calls += 1
    end()
    assert.equal 'riak@127.0.0.1', data.node
    assert.ok data.serverVersion.match(/\d+\.\d+/)

test (db, end) ->
  # test RpbListKeysResp error
  keys = []
  meta = {}
  db.processKeysResponse {errcode: 1}, keys, meta, (err, d) ->
    assert.equal 1, d.errcode
    calls += 1

  # test multiple RpbListKeysResp messages
  db.processKeysResponse {keys: [1]}, keys, meta, (err, d) ->
    calls += 1 # should never be called!
    assert.fail true

  db.processKeysResponse {keys: [2], done: true}, keys, meta, (err, d) ->
    calls += 1
    assert.deepEqual [1,2], d

  # test RpbMapRedResp error
  resp = phases: []
  db.processMapReduceResponse {errcode: 1}, resp, meta, (err, d) ->
    assert.equal 1, d.errcode
    calls += 1

  # test multiple RpbMapRedResp messages
  db.processMapReduceResponse {phase: 0, response: "[1]"}, resp, meta, (err, d) ->
    calls += 1 # should never be called!
    assert.fail true
  db.processMapReduceResponse {phase: 1, response: "[1]"}, resp, meta, (err, d) ->
    calls += 1 # should never be called!
    assert.fail true
  db.processMapReduceResponse {phase: 0, response: "[2]", done: true}, resp, meta, (err, d) ->
    calls += 1
    assert.deepEqual [0, 1], d.phases
    assert.deepEqual [1, 2], d[0]
    assert.deepEqual [1],    d[1]

  end()

test (db, end) -> 
  db.buckets (err, buckets) ->
    calls += 1
    end()
    # don't deepEqual until we've got a separate Riak backend for testing
    # http://github.com/seancribbs/ripple/compare/4737d67...ed9a65e
    for bucket in [
        'riakjs_airlines'
        'riakjs_airports'
        'riakjs_flights'
      ] then assert.ok (bucket in buckets)

require('./core_riak_tests') test

process.on 'exit', ->
  total = 6
  assert.equal calls, total, "#{calls} out of #{total} protobuf-specific client tests"