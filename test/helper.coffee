# evil globals for tests only.  beware, kids
global.sys    ||= require 'sys'
global.assert ||= require 'assert'
global.riak   ||= require '../lib/index'

# Loads a set of items into Riak, then runs the callback when they're all
# inserted.
#
# load 'protobuf', {
#   bucket1:
#     key1: [data, {meta: 1}]
#     key2: [data, {meta: 1}]
#   bucket2:
#     key1: [data, {meta: 1}]
#     key2: [data, {meta: 1}]
#   }, ->
#     do this
global.LOAD ||= (api, items, callback) ->
  queue = []
  for all bucket, keys of items
    for all key, values of keys
      queue.push [bucket, key, values[0], values[1]]

  total    = queue.length
  inserted = 0

  db_instance api, callback, (db, end) ->
    popQueue queue, db, end

# db_instance 'protobuf', (db, end) ->
#   db.do_some_stuff
#   end() # when all complete
#
db_instance = (api, callbacks...) ->
  callback     = callbacks.pop() # called with db instance
  end_callback = callbacks.pop() # called when ending

  db = riak[api](debug: false)
  callback db, ->
    end_callback() if end_callback
    db.end()

popQueue = (queue, db, end) ->
  [bucket, key, value, options] = queue.shift()

  db.save bucket, key, value, options, (err, data) ->
    if queue.length > 0
      popQueue(queue, db, end)
    else
      end()

# tiny test helper that returns a unique riak db instance.  Calling this
# multiple times should let you run tests concurrently.
#
# test = require('./helper')('protobuf')
# test (db, end) ->
#   db.something() (callbackData) ->
#     assert.ok callbackData
#     end() # the helper will close the riak db instance
#
module.exports = (api) ->
  test = (callback) ->
    db_instance api, callback
  test.api = api
  test

process.on 'uncaughtException', (err) ->
  sys.puts err.stack