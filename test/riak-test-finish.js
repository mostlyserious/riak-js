var assert = require('assert'),
  Riak = require('riak-node'),
  db = new Riak.Client({debug: false}),
  bucket = 'riak-js-test-bucket'

module.exports = {
    
    'clean up': function() {
      db.removeAll(bucket)()
    }
    
}