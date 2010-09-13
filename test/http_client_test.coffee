test = require('./helper') 'http'
calls = 0

# fill with http-specific tests

require('./core_riak_tests') test

# process.on 'exit', ->
#   assert.equal calls, 5, "#{calls} out of 5 protobuf-specific client tests"