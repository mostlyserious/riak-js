var assert = require('assert'),
  Riak = require('riak-node'),
  db = new Riak.Client({debug: false}),
  bucket = 'riak-js-test-bucket'

module.exports = {
  
    // the aim is to cover most of http://wiki.basho.com/display/RIAK/REST+API

    'it should return status 404': function() {      
      db.get(bucket, 'somesuperstrangedocument')(
        function() {
          throw new Error('callback shouldn\'t be called when expecting an errback!');
        },
        function(response, meta) {
          assert.equal(404, meta.statusCode)
        }
      )
    },
    
    'it should assert document creation and deletion': function() {
      db.save(bucket, 'test', {a: 1}, {returnbody: true})(
        function(response, meta) {
          // should return content
          assert.ok(response)
          assert.notEqual(204, meta.statusCode)

          db.get(bucket, 'test')(
            function(response) {
              assert.deepEqual(response, {a: 1})
          
              db.remove(bucket, 'test')(
                function() {
                  db.head(bucket, 'test')(undefined, function(undefined, meta) {
                    assert.equal(404, meta.statusCode)
                  })
                }
              )
            }
          )
        }
      )
      
    },
    
    'it should update a document': function() {
      db.save(bucket, 'test2', {loaded: true, items: [1, 5, 8]})(
        function(response, meta) {
          assert.equal(response, "")
          assert.equal(204, meta.statusCode)
          
          db.get(bucket, 'test2')(
            function(response, meta) {
              assert.deepEqual(response, {loaded: true, items: [1, 5, 8]})
              
              db.save(bucket, 'test2', {items: [1, 5, 8, 9], other: {s: "a string"}})(
                function() {
                  db.get(bucket, 'test2')(function(response) {
                    assert.deepEqual(response, {items: [1, 5, 8, 9], other: {s: "a string"}})
                    // assert.ok(9 in response.items)
                  }
                )
              }
            )
          }
        )
      })
    },
    
    'it should return a 304 if etag matches': function() {
      db.get(bucket, 'test2')(
        function(response, meta) {
          assert.equal(meta.statusCode, 200)
          var etag = meta.headers['etag']
                    
          db.head(bucket, 'test2', {etag: etag})(
            function(response, meta) {
              assert.equal(meta.statusCode, 304)
            }
          )
        }
      )
    }
    
}