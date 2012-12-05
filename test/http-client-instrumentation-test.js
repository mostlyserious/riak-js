var HttpClient = require('../lib/http-client'),
  HttpMeta = require('../lib/http-meta'),
  should = require('should'),
  util = require('util');

var db, events = [], listener, bucket;

describe('http-client-instrumentation-tests', function() {
  before(function(done) {
    db = new HttpClient({ port: 8098 });

    listener = {
      "riak.request.start": function(event) {
        events.push(event)
      },
      "riak.request.response": function(event) {
        events.push(event)
      },
      "riak.request.finish": function(event) {
        events.push(event)
      },
      "riak.request.end": function(event) {
        events.push(event)
      }
    };

    // Ensure unit tests don't collide with pre-existing buckets
    bucket = 'users-riak-js-tests';

    db.registerListener(listener);

    done();
  });

  it('Create an object', function(done) {
    db.save(bucket, 'someone@gmail.com',
      {name: 'Someone Else'}, function(err, doc, meta) {
        events.length.should.equal(4);
        for (var i = 0; i < events.length; i++) {
          should.exist(events[i].uuid);
        }
        done();
      });
  });
});

