var assert = require('assert'),
  Riak = require('../lib/riak-node'),
  db = new Riak({debug: false}),
  bucket = 'riak-js-test-bucket'
  
  sys = require('sys')

module.exports = {
  
    // the aim is to cover most of http://wiki.basho.com/display/RIAK/REST+API
    
    'it should return status 404': function() {      
      db.get(bucket, 'somesuperstrangedocument')(
        function(doc, meta) {
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
                  db.head(bucket, 'test')(function(undefined, meta) {
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
                  }
                )
              }
            )
          }
        )
      })
    },
    
    'it should assert links work': function() {
      db.save(bucket, 'link-test', '', { returnbody: true, links:
        [{ bucket: bucket, key: 'KLM-8098', tag: 'flight' },
        { bucket: bucket, key: 'KLM-1196', tag: 'flight' }],
        headers: { link: '</riak/list/3>; riaktag="next"' }
      })(
        function(response, meta) {
          assert.equal(meta.links.length, 3)
          meta.removeLink({bucket: bucket, key: 'KLM-8098'})
          assert.equal(meta.links.length, 2)
          meta.links = [{bucket: bucket, key: 'KLM-6024'}, {bucket: bucket, key: 'KLM-1012'}]
          db.save(bucket, 'link-test', '', { links: meta.links, returnbody: true })(
            function(response, meta) {
              assert.equal(meta.links.length, 4)
              assert.ok(meta.links.every(function(n) { return n.bucket !== bucket || n.key !== 'KLM-8098' }))
            }
          )
        }
      )
      
    },
    
    'it should test content types': function() {
      db.save(bucket, 'content', "this is pure text", { type: 'text' })(
        function(text, meta) {
          assert.equal(meta.type, 'text/plain')
        }
      )
    },
    
    // TODO fix this test that triggers an error elsewhere -- async is tricky to test
    
    // 'it should return a 304 if etag matches': function() {
    //   db.get(bucket, 'test')(
    //     function(response, meta) {
    //       assert.equal(meta.statusCode, 200)
    //       var etag = meta.headers['etag']
    //                 
    //       db.head(bucket, 'test', {etag: etag})(
    //         function(response, meta) {
    //           assert.equal(meta.statusCode, 304)
    //         }
    //       )
    //     }
    //   )
    // },
}