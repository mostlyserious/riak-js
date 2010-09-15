test = require('./helper') 'http'
calls = 0

test (db, end) ->
  calls += 1
  db.head 'users', 'ftreacy@gmail.com', (err, data, meta) ->
    console.dir meta

test (db, end) ->
  calls += 1
  db.keys 'users', end

test (db, end) ->
  calls += 1
  db.getAll 'users', (err, users) ->
    db.log users

test (db, end) ->
  calls += 1
  db.count 'users', (err, users) ->
    console.log users
    #assert.equal 4, users



# fill with http-specific tests

require('./core_riak_tests') test

process.on 'exit', ->
  total = 4
  assert.equal calls, total, "#{calls} out of #{total} http-specific client tests"