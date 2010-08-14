assert = require 'assert'
riak   = require '../src/index'
calls  = 0

db = riak.protobuf()
db.ping() (data) ->
  calls += 1
  assert.equal true, data
  db.end()

process.on 'exit', ->
  assert.equal 1, calls