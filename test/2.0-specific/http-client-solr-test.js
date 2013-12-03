var should = require('should'),
    helpers = require('./../test_helper');

var db, bucket;

describe('http-client-solr-tests', function() {
  before(function(done) {
    db = new HttpClient({ port: 8098 });

    // Ensure unit tests don't collide with pre-existing buckets
    bucket = 'users-riak-js-tests-solr';
    done();
  });

  after(function (done) {
    helpers.cleanupBucket(bucket, done);
  });
});
