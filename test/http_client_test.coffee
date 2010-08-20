db = require('../lib/index').http()
sys = require('sys')
http = require('http')
p = require('sys').p

fn = (data, meta) ->
  db.log data
  sys.puts "---"
  db.log meta, { json: true }
  sys.puts "==="

db.ping()(fn)
db.save('users', 'ddd@gmail.com', { time: new Date().getTime() })((data) -> db.get('users', 'ddd@gmail.com')(fn))

# test  = require('./helper') 'http'
# calls = 0
# 
# test (db, end) ->
#   db.ping() (data) ->
#     calls += 1
#     assert.equal true, data
#     end()
# 
# # test (db, end) ->
# #   db.serverInfo() (data) ->
# #     calls += 1
# #     assert.equal 'riak@127.0.0.1', data.node
# #     assert.ok data.serverVersion.match(/\d+\.\d+/)
# #     end()
# 
# LOAD 'http', RIAKJS_CLIENT_TEST_DATA, ->
#   test (db, end) ->
#     db.buckets() (buckets) ->
#       calls += 1
#       assert.deepEqual [
#           'riakjs_airlines'
#           'riakjs_airports'
#           'riakjs_flights'
#         ], buckets.sort()
#       end()
#   
#   test (db, end) ->
#     db.get('riakjs_airlines', 'KLM') (air, meta) ->
#       calls += 1
#       assert.equal 'riakjs_airlines',  meta.bucket
#       assert.equal 'KLM',              meta.key
#       assert.equal 'application/json', meta.contentType
#       assert.equal 111,                air.fleet
#       assert.ok meta.vclock?
#       end()
#   
#   test (db, end) ->
#     db.get('riakjs_flights', 'IBE_4418') (flight) ->
#       assert.equal 'JFK', flight.from
#   
#       db.remove('riakjs_flights', 'IBE_4418') (data) ->
#         assert.ok data
#   
#         db.get('riakjs_flights', 'IBE_4418') (flight) ->
#           assert.equal undefined, flight
#           calls += 1
#           end()
# 
#   # test (db, end) ->
#   #   db.
#   #     map(
#   #       (value) ->
#   #         this.should.raise.something
#   #     ).
#   #     run('riakjs_airlines') (response) ->
#   #       calls += 1
#   #       assert.ok response.message?
#   #       assert.ok response.errcode?
#   #       end()
# 
#   # test (db, end) ->
#   #   db.
#   #     map(name: 'Riak.mapValuesJson', keep: true).
#   #     reduce(
#   #       (values) ->
#   #         values.reduce (acc, value) ->
#   #           acc + value.fleet
#   #         , 0
#   #     ).
#   #     run('riakjs_airlines') (response) ->
#   #       calls += 1
#   #       assert.deepEqual [0, 1], response.phases.sort()
#   #       assert.equal      7,     response[0].length
#   #       assert.equal      1029,  response[1]
#   #       end()
# 
#   # test (db, end) ->
#   #   db.keys('riakjs_airports') (keys) ->
#   #     calls += 1
#   #     assert.equal 8,     keys.length
#   #     assert.equal 'AMS', keys.sort()[0]
#   #     end()
# 
#   # test (db, end) ->
#   #   # test RpbListKeysResp error
#   #   keys = []
#   #   db.processKeysResponse {errcode: 1}, keys, (d) ->
#   #     assert.equal 1, d.errcode
#   #     calls += 1
#   # 
#   #   # test multiple RpbListKeysResp messages
#   #   db.processKeysResponse {keys: [1]}, keys, (d) ->
#   #     calls += 1 # should never be called!
#   #     assert.fail true
#   # 
#   #   db.processKeysResponse {keys: [2], done: true}, keys, (d) ->
#   #     calls += 1
#   #     assert.deepEqual [1,2], keys
#   # 
#   #   # test RpbMapRedResp error
#   #   resp = phases: []
#   #   db.processMapReduceResponse {errcode: 1}, resp, (d) ->
#   #     assert.equal 1, d.errcode
#   #     calls += 1
#   # 
#   #   # test multiple RpbMapRedResp messages
#   #   db.processMapReduceResponse {phase: 0, response: "[1]"}, resp, (d) ->
#   #     calls += 1 # should never be called!
#   #     assert.fail true
#   #   db.processMapReduceResponse {phase: 1, response: "[1]"}, resp, (d) ->
#   #     calls += 1 # should never be called!
#   #     assert.fail true
#   #   db.processMapReduceResponse {phase: 0, response: "[2]", done: true}, resp, (d) ->
#   #     calls += 1
#   #     assert.deepEqual [0, 1], resp.phases
#   #     assert.deepEqual [1, 2], resp[0]
#   #     assert.deepEqual [1],    resp[1]
#   # 
#   #   end()
# 
# process.on 'exit', ->
#   assert.equal 4, calls