var HttpClient = require('../http-test-client'),
should = require('should'),
helpers = require('./../test_helper');

var db, events = [], listener, bucket;

describe('http-client-search-tests', function() {
  before(function(done) {
    db = new HttpClient();

    // Ensure unit tests don't collide with pre-existing buckets
    bucket = 'users-riak-js-tests';
    var obj = { email: 'test-search@gmail.com', name: 'Testy Test for Riak Search' };
    db.saveBucket(bucket, {search: true}, function(error) {
      db.save(bucket, 'test-search@gmail.com', obj, function(err, data, meta) {
        done();
      });
    });
  });

  after(function (done) {
    helpers.cleanupBucket(bucket, done);
  });

  it('Save the properties of a bucket', function(done) {
    db.saveBucket(bucket, { search: true }, function(err) {
      should.not.exist(err);

      done();
    });
  });

  it('Get the properties of a bucket', function(done) {
    db.getBucket(bucket, function(err, props) {
      should.not.exist(err);
      should.exist(props);
      props.search.should.equal(true);

      done();
    });
  });

  it('Save a document to a search enabled bucket', function(done) {
    db.save(bucket, 'test-search2@gmail.com',
      {
        email: 'test-search2@gmail.com',
        name: 'Testy Test 2 for Riak Search'
      },
      function(err, data, meta) {
        should.not.exist(err);
        should.not.exist(data);
        should.exist(meta);
        meta.key.should.equal('test-search2@gmail.com');
        meta.statusCode.should.equal(204);

        done();
      });
  });

  it('Map/Reduce with search', function(done) {
    db.mapreduce.search(bucket, 'email:test-search@gmail.com')
    .map('Riak.mapValuesJson')
    .run(function(err, data) {
      should.not.exist(err);
      should.exist(data);
      data.length.should.equal(1);
      data[0].email.should.equal('test-search@gmail.com');

      done();
    });
  });

  it('Searching via Solr interface', function(done) {
    db.search.find(bucket, 'email:test-search@gmail.com', function(err, data) {
      should.not.exist(err);
      should.exist(data);
      data.numFound.should.equal(1);
      data.docs[0].id.should.equal('test-search@gmail.com');
      data.docs[0].fields.email.should.equal('test-search@gmail.com');

      done();
    });
  });

  it('Add a document', function(done) {
    db.search.add(bucket, {id: 'test-add-search@gmail.com', name: 'Sean Cribbs'},
      function(err) {
        should.not.exist(err);

        done();
      });
  });

  it('Find added document', function(done) {
    db.search.find(bucket, 'name:"Sean Cribbs"', function(err, data) {
      should.not.exist(err);
      should.exist(data);
      data.numFound.should.equal(1);
      data.docs[0].id.should.equal('test-add-search@gmail.com');
      data.docs[0].fields.name.should.equal('Sean Cribbs');

      done();
    });
  });

  it('Remove the added document', function(done) {
    db.search.remove(bucket, {id: 'test-add-search@gmail.com'}, function(err) {
      should.not.exist(err);

      // try and find the removed document
      db.search.find(bucket, 'name:"Sean Cribbs"', function(err, data) {
        should.not.exist(err);
        should.exist(data);
        data.numFound.should.equal(0);

        done();
      });
    });
  });
});
