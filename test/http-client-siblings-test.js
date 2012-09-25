var httpclient = require('../lib/http-client'),
  httpmeta = require('../lib/http-meta'),
  seq = require('seq'),
  util = require('util'),
  assert = require('assert'),
  test = require('../lib/utils').test;

var db = new httpclient({ port: 8098, accept: 'multipart/mixed,application/json;q=0.7, */*;q=0.5'}),
  bucket = 'siblings';

seq()
  .seq(function() {
    test('Enable siblings');
    db.saveBucket(bucket, {allow_mult: true}, this);
  })
  .seq(function() {
    test('Delete existing objects');
    db.remove(bucket, 'haensel', function() {
      this.ok();
    }.bind(this));
  })
  .seq(function() {
    test('Create first sibling');
    db.save(bucket, 'haensel', {eats: 'lebkuchen'}, function() {
      this.ok();
    }.bind(this));
  })
  .seq(function() {
    test('Create second sibling');
    db.save(bucket, 'haensel', {likes: 'lebkuchen'}, function() {
      this.ok()
    }.bind(this));
  })
  .seq(function() {
    db.get(bucket, 'haensel', function(err, data, meta) {
      assert.equal(data.length, 2)
      this.ok();
    }.bind(this));
  });
