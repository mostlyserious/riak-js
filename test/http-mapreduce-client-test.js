var HttpClient = require('../lib/http-client'),
  HttpMeta = require('../lib/http-meta'),
  seq = require('seq'),
  util = require('util'),
  assert = require('assert'),
  test = require('../lib/utils').test;

var db = new HttpClient({ port: 8098 }),
  db2 = new HttpClient({ port: 64208 }),
  many = [];
for (var i = 0; i < 600; i++) many.push(String(i));

/* Tests */

seq()

  .seq(function() {
    test('Create object');
    db.save('map-users', 'test@gmail.com', {name: "Sean Cribbs"}, function(err, data, meta) {
      this.ok();
    }.bind(this));
  })
  .seq(function() {
    test('Map/Reduce');
    db.mapreduce.add('map-users').map('Riak.mapValuesJson').run(this);
  })
  .seq(function(data) {
    assert.ok(data);
    this.ok();
  })
  .catch(function(err) {
    console.log(err.stack);
    process.exit(1);
  })
  

