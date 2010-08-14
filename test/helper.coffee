# evil globals for tests only.  beware, kids
global.sys    = require 'sys'
global.assert = require 'assert'
global.riak   = require '../src/index'

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
  (callback) ->
    db = global.riak[api]()
    callback db, ->
      db.end()