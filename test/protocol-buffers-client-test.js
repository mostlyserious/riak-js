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
    setTimeout(function() {
      db.end();
    }, 100);
  })
  .catch(function(err) {
    console.log(err.stack);
    process.exit(1);
  });
