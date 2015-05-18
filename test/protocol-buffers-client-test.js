var ProtocolBuffersClient = require('./protocol-buffers-test-client'),
  util = require('util'),
  helpers = require('./test_helper'),
  should = require('should');


var db;

describe('protocol-buffers-client-tests', function() {
  before(function(done) {
    db = new ProtocolBuffersClient();
    done();
  });

  after(function(done) {
    helpers.cleanupBucket('riak-js-test-pb-users', function () {
      helpers.cleanupBucket('riak-js-test-pb-users-fetch-keys', function () {
        db.end();
        done();
      });
    });
  });

  it("Saves an object", function(done) {
    db.save('riak-js-test-pb-users', 'user@gmail.com', {name: 'Joe Example'}, {content_type: "application/json"}, function(err, data) {
      should.not.exist(err);
       done();
    });
  });

  it('Gets an object', function(done) {
    db.save('riak-js-test-pb-users', 'user2@gmail.com', {name: 'Joe Example'}, {content_type: "application/json"}, function(data) {
      db.get('riak-js-test-pb-users', 'user2@gmail.com', function(err, data, meta) {
        should.not.exist(err);
        should.exist(data);
        data.name.should.equal('Joe Example');
        done();
      });
    });
  });

  it('Reuses a meta object', function(done) {
    db.get('riak-js-test-pb-users', 'user@gmail.com', function(err, data, meta) {
      db.save('riak-js-test-pb-users', 'user@gmail.com', {name: "Joe Re-example"}, meta, function(err, data, meta) {
        done();
      });
    });
  });

  it('Deletes an object', function(done) {
    db.remove('riak-js-test-pb-users', 'user@gmail.com', function(err) {
      done();
    });
  });

  it('Set a notFound error when fetching a deleted object', function(done) {
    db.get('riak-js-test-pb-users', 'user@gmail.com', function(err, data, meta) {
      should.exist(err.notFound);
      done();
    });
  });

  it('Gets buckets', function(done) {
    db.buckets(function(err, data) {
      should.exist(data);
      data.should.containEql("riak-js-test-pb-users");
      should.exist(data.indexOf("riak-js-test-pb-users"));
      done();
    });
  });

  it("Gets bucket properties", function(done) {
    db.getBucket('riak-js-test-pb-users', function(err, properties, meta) {
      should.exist(properties);
      properties.n_val.should.equal(3);
      should.exist(properties.allow_mult);
      done();
    });
  });

  it("Saves bucket properties", function(done) {
    db.getBucket('riak-js-test-pb-users', function(err, properties, meta) {
      var allow_mult = properties.allow_mult;
      db.saveBucket('riak-js-test-pb-users', {allow_mult: !allow_mult}, function(err) {
        should.exist(!allow_mult);
        done();
      });
    });
  });

  it("Pings", function(done) {
    db.ping(function(err, pong) {
      should.exist(pong);
      done();
    });
  });

  it("Doesn't set notFound on ping", function(done) {
    db.ping(function(err, pong) {
      should.not.exist(err);
      done();
    });
  });

  it("Doesn't set notFound on save", function(done) {
    db.save('riak-js-test-pb-users', 'paul', {}, function(err) {
      should.not.exist(err);
      done();
    });
  });

  it("Fetches keys", function(done) {
    db.save('riak-js-test-pb-users-fetch-keys', 'user@gmail.com', {name: 'Joe Example'}, {content_type: "application/json"}, function(data) {
      db.save('riak-js-test-pb-users-fetch-keys', 'user1@gmail.com', {name: 'Joe Example'}, {content_type: "application/json"}, function(data) {
        db.save('riak-js-test-pb-users-fetch-keys', 'user2@gmail.com', {name: 'Joe Example'}, {content_type: "application/json"}, function(data) {
          db.save('riak-js-test-pb-users-fetch-keys', 'user3@gmail.com', {name: 'Joe Example'}, {content_type: "application/json"}, function(data) {
            db.save('riak-js-test-pb-users-fetch-keys', 'user4@gmail.com', {name: 'Joe Example'}, {content_type: "application/json"}, function(data) {
              var keys = db.keys('riak-js-test-pb-users-fetch-keys', {keys: 'stream'});
              var result = [];
              keys.on('keys', function(keys) {
                result = result.concat(keys);
              }).on('end', function(data) {
                result.should.have.length(5);
                done();
              });
            });
          });
        });
      });
    });
  });
});
