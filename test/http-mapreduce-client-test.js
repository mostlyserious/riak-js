var HttpClient = require('../lib/http-client'),
  HttpMeta = require('../lib/http-meta'),
  util = require('util'),
  should = require('should');

var db, bucket;

/* Tests */

describe('http-mapreduce-client-tests', function() {
  before(function(done) {
    db = new HttpClient({ port: 8098 });

    // Ensure unit tests don't collide with pre-existing buckets
    bucket = 'map-users-riak-js-tests';

    db.save(bucket, 'test@gmail.com', {name: "Sean Cribbs"}, function(err, data, meta) {
      should.not.exist(err);
      db.save(bucket, 'other@gmail.com', {name: "Mathias Meyer"}, function(err, data, meta) {
        should.not.exist(err);
        done();
      });
    });
  });

  it('Map to an array of JSON objects', function(done) {
    db.mapreduce.add(bucket).map('Riak.mapValuesJson').run(function(err, data) {
      should.not.exist(err);
      should.exist(data);
      data.length.should.equal(2);

      for (var i = 0; i < data.length; i++) {
        should.exist(data[i].name);
      }

      done();
    });
  });

  it('Map to a custom function', function(done) {
    db.mapreduce.add(bucket).map(function(value, keyData, args){
      return ['custom'];
    }).run(function(err, data) {
      should.not.exist(err);
      should.exist(data);
      data.length.should.equal(2);

      for (var i = 0; i < data.length; i++) {
        data[i].should.equal('custom');
      }

      done();
    });
  });

  it('Map with arguments', function(done) {
    db.mapreduce.add(bucket).map('Riak.mapByFields', {
      name: 'Sean Cribbs'
    }).run(function(err, data) {
        should.not.exist(err);
        should.exist(data);
        data.length.should.equal(1);
        data[0].name.should.equal('Sean Cribbs');
        done();
      });
  });

  // TODO not sure this has the correct prerequisites
  it('Map/Reduce', function(done) {
    db.mapreduce.add(bucket).map('Riak.mapByFields', {
      name: 'Sean Cribbs'
    }).reduce('Riak.reduceLimit', 2)
      .run(function(err, data) {
        should.not.exist(err);
        should.exist(data);
        data.length.should.equal(1);
        done();
      });
  });

  it('Map Erlang functions', function(done) {
    db.mapreduce.add(bucket).map({
      language: 'erlang',
      module: 'riak_kv_mapreduce',
      function: 'map_object_value'})
      .run(function(err, data) {
        should.not.exist(err);
        should.exist(data);
        data.length.should.equal(2);
        done();
      });
  });

  // TODO figure out why this isn't passing. It seems like straight port from
  // the previous tests
  //it('Chain phases with bucket inputs', function(done) {
  //  db.mapreduce.add([
  //    [bucket, 'test@gmail.com']
  //  ]).map(function(value) {
  //      return [
  //        [bucket, 'other@gmail.com']
  //      ];
  //    })
  //    .map('Riak.mapValuesJson')
  //    .run(function(err, data) {
  //      console.dir(err.message);
  //      should.not.exist(err);
  //      should.exist(data);
  //      data[0].name.should.equal('Mathias Meyer');
  //      done();
  //    });
  //});

  after(function(done) {
    db.remove(bucket, 'test@gmail.com', function() {
      db.remove(bucket, 'other@gmail.com', function() {
        done();
      });
    });
  });
});
