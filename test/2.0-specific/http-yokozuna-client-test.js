var HttpClient = require('../../lib/http-client'),
    should = require('should'),
    helpers = require('./../test_helper');

var db, bucket, yzIndex;

describe('http-client-solr-tests', function() {
  before(function(done) {
    db = new HttpClient({ port: 8098 });

    // Ensure unit tests don't collide with pre-existing buckets
    bucket = 'users-riak-js-tests-solr';
    yzIndex = 'riak-js-yz-index-test';
    var obj = {
      email_s: 'test-search@gmail.com',
      name: 'Testy Test for Riak Search'
    };
    db.yokozuna.createIndex(yzIndex, function(err) {
      db.saveBucket(bucket, { yz_index: yzIndex }, function (err) {
        setTimeout(function () {
          db.save(bucket, 'test-search@gmail.com', obj, function(err, data, meta) {
            setTimeout(function () {
              done();
            }, 4000);
          });
        }, 4000);
      });
    });
  });

  after(function (done) {
    helpers.cleanupBucket(bucket, done);
  });

  it('creates an index', function (done) {
    db.yokozuna.getIndex(yzIndex, function (err, data) {
      should.not.exist(err);
      data.name.should.equal(yzIndex);
      data.schema.should.equal('_yz_default');
      done();
    });
  });

  it('saves the index bucket property', function (done) {
    db.saveBucket(bucket, { yz_index: yzIndex }, function (err) {
      should.not.exist(err);

      done();
    });
  });

  it('gets the index bucket property', function (done) {
    db.getBucket(bucket, function (err, props) {
      props.yz_index.should.equal(yzIndex);
      done();
    });
  });


  it('Searching via Solr interface', function (done) {
    db.yokozuna.find(yzIndex, 'email_s:test-search@gmail.com', function(err, data) {
      should.not.exist(err);
      should.exist(data);

      data.docs[0].email_s.should.equal('test-search@gmail.com');

      done();
    });
  });
});
