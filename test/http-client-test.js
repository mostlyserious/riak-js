var HttpClient = require('../lib/http-client'),
  seq = require('seq'),
  assert = require('assert'),
  test = require('../lib/utils').test;

var db = new HttpClient(),
  db2 = new HttpClient({ port: 1 });
  
seq()

  .seq(function() {
    test('Save');
    db.save('users', 'test@gmail.com', { email: 'test@gmail.com', name: 'Testy Test' }, function(err, data, meta) {
      assert.ok(meta.statusCode, 204);
      assert.ok(!data);
      assert.equal(meta.responseEncoding, 'utf8');
      assert.equal(meta.key, 'test@gmail.com');
      this.ok();
    }.bind(this));
  })

  .seq(function() {
    test('Get with headers');
    db.get('users', 'test@gmail.com', { headers: { 'Host': '127.0.0.2' }, contentType: '2' }, this);
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
    db.exists('users', 'test@gmail.com', this);
  })
  .catch(function(err) {
    assert.equal(err.statusCode, 404);
  })
  .seq(function(does) {
    assert.notEqual(does, true);
    this.ok();
  })
  
  .seq(function() {
    test('Ensure a second riak-js instance does not inherit settings from the first one');
    
    // we're expecting this instance (supposedly listening on port 1) to be down
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
    assert.equal(doc.user, 'test2@gmail.com')
    this.ok();
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
    console.log('All ok');
  })
  
  .catch(function(err) {
    console.log(err.stack);
  });