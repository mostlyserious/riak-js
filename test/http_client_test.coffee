test = require('./helper') 'http'
calls = 0

test (db, end) ->
  calls += 1
  db.get 'users', 'ftreacy@gmail.com', end

test (db, end) ->
  calls += 1
  db.keys 'users', end

# fill with http-specific tests

require('./core_riak_tests') test

process.on 'exit', ->
  total = 2
  assert.equal calls, total, "#{calls} out of #{total} http-specific client tests"