sys    = require 'sys'
assert = require 'assert'
riak   = require '../src/index'
calls  = 0

db1 = riak.protobuf()
db1.ping() (data) ->
  calls += 1
  assert.equal true, data
  db1.end()

db2 = riak.protobuf()
db2.serverInfo() (data) ->
  calls += 1
  assert.equal 'riak@127.0.0.1', data.node
  assert.ok data.serverVersion.match(/\d+\.\d+/)
  db2.end()

process.on 'exit', ->
  assert.equal 2, calls