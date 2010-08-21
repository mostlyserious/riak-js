test = require('./helper') 'protobuf'
calls = 0

test (db, end) ->
  db.serverInfo() (data) ->
    calls += 1
    end()
    assert.equal 'riak@127.0.0.1', data.node
    assert.ok data.serverVersion.match(/\d+\.\d+/)

test (db, end) ->
  # test RpbListKeysResp error
  keys = []
  db.processKeysResponse {errcode: 1}, keys, (d) ->
    assert.equal 1, d.errcode
    calls += 1

  # test multiple RpbListKeysResp messages
  db.processKeysResponse {keys: [1]}, keys, (d) ->
    calls += 1 # should never be called!
    assert.fail true

  db.processKeysResponse {keys: [2], done: true}, keys, (d) ->
    calls += 1
    assert.deepEqual [1,2], keys

  # test RpbMapRedResp error
  resp = phases: []
  db.processMapReduceResponse {errcode: 1}, resp, (d) ->
    assert.equal 1, d.errcode
    calls += 1

  # test multiple RpbMapRedResp messages
  db.processMapReduceResponse {phase: 0, response: "[1]"}, resp, (d) ->
    calls += 1 # should never be called!
    assert.fail true
  db.processMapReduceResponse {phase: 1, response: "[1]"}, resp, (d) ->
    calls += 1 # should never be called!
    assert.fail true
  db.processMapReduceResponse {phase: 0, response: "[2]", done: true}, resp, (d) ->
    calls += 1
    assert.deepEqual [0, 1], resp.phases
    assert.deepEqual [1, 2], resp[0]
    assert.deepEqual [1],    resp[1]

  end()

require('./core_riak_tests') test

process.on 'exit', ->
  assert.equal calls, 5, "#{calls} out of 5 protobuf-specific client tests"