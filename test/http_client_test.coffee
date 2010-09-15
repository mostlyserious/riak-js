test = require('./helper') 'http'
calls = 0

# fill with *working-in-any-env* http-specific tests

# test (db, end) ->
#   calls += 1
#   db.head 'users', 'ddd@gmail.com', (err, data, meta) ->
#     assert.equal data, ""

# test (db, end) ->
#   calls += 1
#   db.keys 'users', end

# test (db, end) ->
#   calls += 1
#   db.getAll 'users', (err, users) ->
#     # db.log users

# test (db, end) ->
#   calls += 1
#   db.count 'users', (err, users) ->
#     # console.log users
#     #assert.equal 4, users

require('./core_riak_tests') test

process.on 'exit', ->
  total = 0
  assert.equal calls, total, "#{calls} out of #{total} http-specific client tests"