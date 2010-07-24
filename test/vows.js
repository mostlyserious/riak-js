var vows = require('vows'),
  fs = require('fs'),
  db = require('riak-js').getClient({debug: false}),
  assert = require('assert'),
  bucket = 'riak-js-test-2';


vows.describe('riak-js').addBatch({
  
  // 'A user request': {
  //   topic: function() {
  //     db.get(bucket, 'ftreacy@gmail.com')(this.callback)
  //   },
  //   'should respond with a 200 OK': function (user, meta) {
  //     assert.isObject(user)
  //     assert.equal (meta.statusCode, 200);
  //   }
  // },
  
  'A non-existing document': {
    topic: function() {
      db.get(bucket, 'thiskeyobviouslydoesnotexist')(this.callback)
    },
    'should not be there': function(user, meta) {
      assert.equal(404, meta.statusCode)
    }
  },
  
  'A document': {
    topic: function() {
      db.save(bucket, 'test', {a: 1}, {returnbody: true})(this.callback)
    },
    'should be saved': function(response, meta) {
      assert.ok(response)
    },
    'should not return 204': function(response, meta) {
      assert.notEqual(204, meta.statusCode)
    },
    'and be deleted': function(response, meta) {
      db.remove(bucket, 'test')(function(){
        db.head(bucket, 'test')(function(undefined, meta) {
          assert.equal(null, meta.statusCode)
        })
      })
    }
  },
  
  


  // 'A document': function() {
  //   db.save(bucket, 'test', {a: 1}, {returnbody: true})(
  //     function(response, meta) {
  //       // should return content
  //       assert.ok(response)
  //       assert.notEqual(204, meta.statusCode)
  // 
  //       db.get(bucket, 'test')(
  //         function(response) {
  //           assert.deepEqual(response, {a: 1})
  //       
  //           db.remove(bucket, 'test')(
  //             function() {
  //               db.head(bucket, 'test')(function(undefined, meta) {
  //                 assert.equal(404, meta.statusCode)
  //               })
  //             }
  //           )
  //         }
  //       )
  //     }
  //   )
  //   
  // },  
    
    // 'stat': {
    //   topic: function () {
    //     fs.stat('/tmp/mr', this.callback);
    //   },
    //   'can be accessed': function (err, stat) {
    //     assert.isObject   (err);        // We have no error
    //     assert.isObject (stat);       // We have a stat object
    //   },
    //   'is not empty': function (err, stat) {
    //     // assert.isNotZero (stat.size); // The file size is > 0
    //   }
    // },
    //   
    // 'A strawberry': {
    //     topic: new(Strawberry),
    //     'is red': function (strawberry) {
    //         assert.equal (strawberry.color, '#ff0000');
    //     },
    //     'and tasty': function (strawberry) {
    //         assert.isTrue (strawberry.isTasty());
    //     }
    // },
    // 'A banana': {
    //     topic: new(Banana),
    // 
    //     'when peeled synchronously': {
    //         topic: function (banana) {
    //             return banana.peelSync();
    //         },
    //         'returns a `PeeledBanana`': function (result) {
    //             assert.instanceOf (result, PeeledBanana);
    //         }
    //     },
    //     'when peeled asynchronously': {
    //         topic: function (banana) {
    //             banana.peel(this.callback);
    //         },
    //         'results in a `PeeledBanana`': function (err, result) {
    //             assert.instanceOf (result, PeeledBanana);
    //         }
    //     }
    // }
    
})
.addBatch({
  // 'The whole database' : {
  //   topic: function() {
  //     db.removeAll(bucket)(this.callback)
  //   },
  //   'should be deleted when done': function(r){
  //     assert.ok(r)
  //   }
  // }
})
.export(module, {error: false});