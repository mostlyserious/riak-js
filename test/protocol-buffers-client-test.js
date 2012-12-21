var ProtocolBuffersClient = require('../lib/protocol-buffers-client'),
  seq = require('seq'),
  util = require('util'),
  assert = require('assert'),
  test = require('../lib/utils').test;

var db = new ProtocolBuffersClient();

seq().
  seq(function() {
    test('Save an object');
    db.save('pb-users', 'user@gmail.com', {name: 'Joe Example'}, {content_type: "application/json"}, function(data) {
      this.ok();
    }.bind(this));
  })
  .seq(function() {
    test('Get an object');
    db.get('pb-users', 'user@gmail.com', function(err, data, meta) {
      assert.equal(data.name, 'Joe Example');
      this.ok(meta);
    }.bind(this));
  })
  .seq(function(meta) {
    test('Reusing a meta object');
    db.save('pb-users', 'user@gmail.com', {name: "Joe Re-example"}, meta, function(err, data, meta) {
      this.ok();
    }.bind(this));
  })
  .seq(function() {
    test('Refetch the object');
    db.get('pb-users', 'user@gmail.com', function(err, data) {
      assert.equal(data.name, "Joe Re-example");
      this.ok();
    }.bind(this));
  })
  .seq(function() {
    test('Delete an object');
    db.remove('pb-users', 'user@gmail.com', function(err) {
      this.ok();
    }.bind(this));
  })
  .seq(function() {
    test('Fetch deleted object');
    db.get('pb-users', 'user@gmail.com', function(err, data, meta) {
      assert.equal(err.notFound, true);
      this.ok();
    }.bind(this));
  })
  .seq(function() {
    test('Get buckets');
    db.buckets(function(err, data) {
      this.ok(data)
    }.bind(this));
  })
  .seq(function(buckets) {
    assert(buckets.indexOf("users") >= 0);
    this.ok();
  })
  .seq(function() {
    test("Get bucket properties");
    db.getBucket('users', function(err, properties, meta) {
      assert.ok(properties);
      this.ok(properties);
    }.bind(this));
  })
  .seq(function(properties) {
    assert.equal(properties.n_val, 3);
    this.ok(properties.allow_mult);
  })
  .seq(function(allow_mult) {
    test("Save bucket properties");
    db.saveBucket('users', {allow_mult: !allow_mult}, function(err) {
      this.ok(!allow_mult);
    }.bind(this));
  })
  .seq(function(allow_mult) {
    db.getBucket('users', function(err, properties, meta) {
      assert.equal(properties.allow_mult, allow_mult)
      this.ok();
    }.bind(this));
  })
  .seq(function() {
    test("Ping");
    db.ping(function(pong) {
      this.ok(pong);
    }.bind(this));
  })
  .seq(function() {
    setTimeout(function() {
      db.end();
    }, 100);
  })
  .catch(function(err) {
    console.log(err.stack);
    process.exit(1);
  });
