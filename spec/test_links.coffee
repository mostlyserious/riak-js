vows = require 'vows'
assert = require 'assert'
api = process.env['RIAKJS_TEST_API'] or 'http'
db = require('../src/index').getClient({ api: api, debug: true })


exports.testLinkWalking = ->
  db.links "repositories","t1$q3",[["objects","commit",1],["objects","tree",1],["objects","blob",1]],(err, data) ->
    console.log "data", data

