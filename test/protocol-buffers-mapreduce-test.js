var ProtocolBuffersClient = require('../lib/protocol-buffers-client'),
    should = require('should');

var db, bucket;

describe('protocol-buffers-mapreduce-client', function() {
  beforeEach(function(done) {
    db = new ProtocolBuffersClient();    
    bucket = 'map-pb-users-riak-js-tests';

    db.save(bucket, 'test@gmail.com', {name: "Sean Cribbs"}, function(err, data, meta) {
      db.save(bucket, 'other@gmail.com', {name: "Mathias Meyer"}, function(err, data, meta) {
        done();
      });
    });
  });

  afterEach(function(done) {
    db.end();
    done();
  });

  it('Map to an array of JSON objects', function(done) {
    db.mapreduce.add(bucket).map('Riak.mapValuesJson').run(function(err, data) {
      should.not.exist(err);
      data[0].should.have.length(2);
      should.exist(data);

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
      should.exist(data);
      data[0].should.have.length(2);

      for (var i = 0; i < data[0].length; i++) {
        data[0][i].should.equal('custom');
      }

      done();
    });
  });

  it('Map with arguments', function(done) {
    db.mapreduce.add(bucket).map('Riak.mapByFields', {
      name: 'Sean Cribbs'
    }, {keep: true}).run(function(err, data) {
        should.exist(data);
        data[0].should.have.length(1);
        data[0][0].name.should.equal('Sean Cribbs');
        done();
      });
  });

  // TODO not sure this has the correct prerequisites
  it('Map/Reduce', function(done) {
    db.mapreduce.add(bucket).map('Riak.mapByFields', {
      name: 'Sean Cribbs'
    }).reduce('Riak.reduceLimit', 2)
      .run(function(err, data) {
        should.exist(data);
        data[1].should.have.length(1)
        done();
      });
  });

  it('Map Erlang functions', function(done) {
    db.mapreduce.add(bucket).map({
      language: 'erlang',
      module: 'riak_kv_mapreduce',
      function: 'map_object_value'})
      .run(function(err, data) {
        should.exist(data);
        data[0].should.have.length(2);
        done();
      });
  });

  it('Stores error messages', function(done) {
    db.mapreduce.add(bucket).map('Riak.illegal_code').run(function(err, data) {
      should.exist(err.message);
      should.exist(err.statusCode);
      done();
    })
  });

  it('Supports chunked map/reduce', function(done) {
    var job = db.mapreduce.add(bucket).map('Riak.mapValuesJson').run({chunked: true});
    var result = [];
    job.on('data', function(data) {
      result.push(data)
    }).on('end', function(data) {
      result.should.have.length(2);
      done();
    });
  })
});
