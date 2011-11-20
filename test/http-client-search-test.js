var HttpClient = require('../lib/http-client'),
  seq = require('seq'),
  assert = require('assert'),
  test = require('../lib/utils').test;

var db = new HttpClient({ port: 7098 }),
  bucket = 'users';
  
seq()

  .seq(function() {
    test('Save the properties of a bucket');
    db.saveBucket(bucket, { search: true }, this);
  })

  .seq(function() {
    test('Get the properties of a bucket');
    db.getBucket(bucket, this);
  })
  .seq(function(props) {
    assert.equal(props.search, true);
    this.ok();
  })

  .seq(function() {
    test('Save');
    db.save('users', 'test-search@gmail.com', { email: 'test-search@gmail.com', name: 'Testy Test for Riak Search' }, function(err, data, meta) {
      assert.equal(meta.statusCode, 204);
      assert.ok(!data);
      assert.equal(meta.key, 'test-search@gmail.com');
      this.ok();
    }.bind(this));
  })
  
  .seq(function() {
    test('Map/Reduce with search');
    db.search('users', 'email:test-search@gmail.com').map('Riak.mapValuesJson').run(this);
  })
  .seq(function(data) {
    assert.equal(data[0].email, "test-search@gmail.com");
    this.ok();
  })
  
  .seq(function() {
    test('Remove document');
    db.remove('users', 'test-search@gmail.com', this);
  })
  
  .catch(function(err) {
    console.log(err.stack);
    process.exit(1);
  });