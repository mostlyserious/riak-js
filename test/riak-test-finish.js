var assert = require('assert'),
  Riak = require('../lib/riak-node'),
  db = new Riak({debug: false}),
  bucket = 'riak-js-test-bucket'

module.exports = {
    
    'clean up': function() {
      db.removeAll(bucket)()
    }
    
}