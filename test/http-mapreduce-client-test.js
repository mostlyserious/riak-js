var HttpClient = require('../lib/http-client'),
  HttpMeta = require('../lib/http-meta'),
  seq = require('seq'),
  util = require('util'),
  assert = require('assert'),
  test = require('../lib/utils').test;

var db = new HttpClient({ port: 8098 });

/* Tests */

seq()

  .seq(function() {
    test('Clear database');
    db.remove('map-users', 'test@gmail.com', function() {
      db.remove('map-users', 'other@gmail.com', function() {
        this.ok()
      }.bind(this));
    }.bind(this));
  })
  .seq(function() {
    test('Create object');
    db.save('map-users', 'test@gmail.com', {name: "Sean Cribbs"}, function(err, data, meta) {
      db.save('map-users', 'other@gmail.com', {name: "Mathias Meyer"}, function(err, data, meta) {
        this.ok();
      }.bind(this));
    }.bind(this));
  })
  .seq(function() {
    test('Map');
    db.mapreduce.add('map-users').map('Riak.mapValuesJson').run(this);
  })
  .seq(function(data) {
    test('Successful response');
    assert.ok(data);
    this.ok(data);
  })
  .seq(function(data) {
    test('Returns and evaluates array of JSON objects');
    assert.equal(data.length, 2);
    assert.notEqual(data[0].name, null);
    this.ok();
  })
  .seq(function() {
    test('Custom Map JavaScript functions');
    db.mapreduce.add('map-users').map(function(value, keyData, args) {
      return ['custom'];
    }).run(this);
  })
  .seq(function(data) {
    test('Custom Map function response');
    assert.equal(data[0], 'custom');
    this.ok();
  })
  .seq(function() {
    test('Map with arguments');
    db.mapreduce.add('map-users').map('Riak.mapByFields', {name: 'Sean Cribbs'}).run(this);
  })
  .seq(function(data) {
    test('Successful response');
    assert.equal(data[0].name, 'Sean Cribbs');
    this.ok();
  })
  .seq(function() {
    test('Reduce');
    db.mapreduce.add('map-users').map('Riak.mapByFields', {name: 'Sean Cribbs'}).reduce('Riak.reduceLimit', 2).run(this);
  })
  .seq(function(data) {
    test('Reduce response');
    assert.equal(data.length, 1);
    this.ok();
  })
  .seq(function() {
    test('Map Erlang functions');
    db.mapreduce.add('map-users').map({language: 'erlang', module: 'riak_kv_mapreduce', function: 'map_object_value'}).run(this);
  })
  .seq(function(data) {
    test('Erlang response');
    assert.equal(data.length, 2);
    this.ok();
  })
  .seq(function() {
    test('Chain phases with bucket inputs');
    db.mapreduce.add([['map-users', 'test@gmail.com']]).map(function(value) {
      return [['map-users', 'other@gmail.com']];
    }).map('Riak.mapValuesJson').run(this);
  })
  .seq(function(data) {
    assert.equal(data[0].name, "Mathias Meyer");
    this.ok();
  })
  .catch(function(err) {
    console.log(err)
    console.log(err.stack);
    process.exit(1);
  })
  

