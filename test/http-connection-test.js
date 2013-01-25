var HttpClient = require('../lib/http-client'),
  should = require('should');

var db, bucket;

/* Tests */

describe('http-connection-tests', function() {
  before(function(done) {
    db = new HttpClient({ port: 64208 });

    // Ensure unit tests don't collide with pre-existing buckets
    bucket = 'users-riak-js-tests';

    done();
  });

  it('Connection to an unavailable port shouldn\'t fail the process', function(done) {
    db.get(bucket, 'test@gmail.com', function(err, data, meta) {
      should.exist(err);
      should.not.exist(data);
      should.not.exist(meta);

      done();
    });
  });
});
