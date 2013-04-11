var HttpClient = require('../lib/http-client'),
  HttpMeta = require('../lib/http-meta'),
  should = require('should'),
  util = require('util');

var db, bucket;

describe('http-client-siblings-tests', function() {
  before(function(done) {
    db = new HttpClient({
      port: 8098,
    });

    // Ensure unit tests don't collide with pre-existing buckets
    bucket = 'siblings-riak-js-tests';

    done();
  });

  it('Enable siblings', function(done) {
    db.saveBucket(bucket, {allow_mult: true}, function(err) {
      should.not.exist(err);
      done();
    });
  });

  it('Create and get siblings', function(done) {
    db.save(bucket, 'haensel', {eats: 'lebkuchen'}, function(err) {
      should.not.exist(err);
      db.save(bucket, 'haensel', {likes: 'lebkuchen'}, function(err) {
        should.not.exist(err);
        db.get(bucket, 'haensel', function(err, data, meta) {
          should.not.exist(err);
          should.exist(data);
          data.length.should.equal(2);

          done();
        });
      });
    });
  });

  after(function(done) {
    db.remove(bucket, 'haensel', function(err) {
      should.not.exist(err);
      done();
    });
  });
});
