var HttpClient = require('../lib/http-client'),
  seq = require('seq'),
  assert = require('assert'),
  test = require('../lib/utils').test;

var db = new HttpClient({ port: 7098 }),
  db2 = new HttpClient({ port: 64208 });
  
seq()

  .seq(function() {
    test('Save with returnbody');
    db.save('users', 'test-returnbody@gmail.com', { email: 'test@gmail.com', name: 'Testy Test', a: [1,2], returnbody: 'yes please' }, { returnbody: true }, function(err, data, meta) {
      assert.equal(meta.statusCode, 200);
      assert.ok(data);
      assert.deepEqual(data.a, [1,2]);
      assert.equal(meta.key, 'test-returnbody@gmail.com');
      this.ok();
    }.bind(this));
  })

  .seq(function() {
    test('Save');
    db.save('users', 'test@gmail.com', { email: 'test@gmail.com', name: 'Testy Test' }, function(err, data, meta) {
      assert.equal(meta.statusCode, 204);
      assert.ok(!data);
      assert.equal(meta.key, 'test@gmail.com');
      this.ok();
    }.bind(this));
  })

  .seq(function() {
    test('Get with headers');
    db.get('users', 'test@gmail.com', { headers: { 'Content-Type': 'application/json' } }, this);
  })
  .seq(function(doc1) {
    assert.ok(doc1);
    this.ok();
  })
  
  .seq(function() {
    test('Get with no options or callback');
    db.get('users', 'test@gmail.com', this);    
  })
  .seq(function(doc2) {
    assert.equal(doc2.email, 'test@gmail.com');
    this.ok();
  })
  
  .seq(function() {
    test('Head request');
    db.head('users', 'test@gmail.com', function(err, data, meta) {
      assert.ok(!err && !data);
      assert.ok(meta.statusCode === 200);
      this.ok();
    }.bind(this));
  })
  
  .seq(function() {
    test('Remove document');
    db.remove('users', 'test@gmail.com', function(err, data, meta) {
      assert.equal(meta.statusCode, 204);
      this.ok();
    }.bind(this));
  })

  .seq(function() {
    test('Document exists');
    db.exists('users', 'test@gmail.com', function(err, does, meta) {
      assert.equal(meta.statusCode, 404);
      assert.equal(does, false);
      this.ok();
    }.bind(this));
  })
  
  .seq(function() {
    test('Ensure a second riak-js instance does not inherit settings from the first one');
    
    // we're expecting this instance to be down (listening on port 64208)
    db2.on('error', function(err) {
      assert.ok(err);
      this.ok();
    }.bind(this));
    
    db2.get('users', 'test@gmail.com');
  })
  
  .seq(function() {
    test('Saving with returnbody=true actually returns the body');
    db.save('users', 'test2@gmail.com', { user: 'test2@gmail.com' }, { returnbody: true }, this);
  })
  .seq(function(doc) {
    assert.ok(doc);
    assert.equal(doc.user, 'test2@gmail.com');
    setTimeout(this.ok, 3000); // wait for damn dead horse riak; see https://issues.basho.com/show_bug.cgi?id=1269
  })
  
  .seq(function() {
    test('Map/Reduce');
    db.add('users').map('Riak.mapValuesJson').run(this);
  })
  .seq(function(data) {
    assert.ok(data);
    // TODO assert more stuff
    this.ok();
  })
  
  .seq(function() {
    test('Map/Reduce with search');
    db.addSearch('users', 'email:test2@gmail.com').map('Riak.mapValuesJson').run(this);
  })
  .seq(function(data) {
    assert.ok(data);
    // TODO assert more stuff, indexing stuff beforehand
    this.ok();
  })
  
  .seq(function() {
    test('Buckets is an Array');
    db.buckets(this);
  })
  .seq(function(buckets) {
    assert.ok(Array.isArray(buckets));
    this.ok();
  })
  
  .seq(function() {
    test('Ping');
    db.ping(this);
  })
  .seq(function(pong) {
    assert.ok(pong);
    this.ok()
  })
  
  .seq(function() {
    test('Stats');
    db.stats(this);
  })
  .seq(function(stats) {
    assert.ok(stats.riak_core_version);
  })
    
  .catch(function(err) {
    console.log(err.stack);
    process.exit(1);
  });