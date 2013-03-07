var HttpClient = require('../lib/http-client'),
  should = require('should');

var db, events = [], listener, bucket;

describe('http-client-search-tests', function() {
  before(function(done) {
    db = new HttpClient({ port: 8098 });

    // Ensure unit tests don't collide with pre-existing buckets
    bucket = 'users-riak-js-tests';

    done();
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
    db.save(bucket, 'test-search@gmail.com',
      {
        email: 'test-search@gmail.com',
        name: 'Testy Test for Riak Search'
      },
      function(err, data, meta) {
        should.not.exist(err);
        should.not.exist(data);
        should.exist(meta);
        meta.key.should.equal('test-search@gmail.com');
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

  after(function(done) {
    db.remove(bucket, 'test-search@gmail.com');
    db.remove(bucket, 'test-add-search@gmail.com');

    done();
  });
});
