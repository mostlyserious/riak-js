var ProtocolBuffersClient = require('../lib/protocol-buffers-client'),
  util = require('util'),
  should = require('should');

var db;

describe('protocol-buffers-client-tests', function() {
  beforeEach(function(done) {
    db = new ProtocolBuffersClient();
    done();
  });

  afterEach(function(done) {
    db.end();
    done();
  });

  it("Saves an object", function(done) {
    db.save('pb-users', 'user@gmail.com', {name: 'Joe Example'}, {content_type: "application/json"}, function(data) {
      done();
    });
  });

  it('Gets an object', function(done) {
    db.get('pb-users', 'user@gmail.com', function(err, data, meta) {
      should.not.exist(err);
      data.name.should.equal('Joe Example');
      done();
    });
  });

  it('Reuses a meta object', function(done) {
    db.get('pb-users', 'user@gmail.com', function(err, data, meta) {
      db.save('pb-users', 'user@gmail.com', {name: "Joe Re-example"}, meta, function(err, data, meta) {
        done();
      });
    });
  });

  it('Deletes an object', function(done) {
    db.remove('pb-users', 'user@gmail.com', function(err) {
      done();
    });
  });
 
  it('Set a notFound error when fetching a deleted object', function(done) {
    db.get('pb-users', 'user@gmail.com', function(err, data, meta) {
      should.exist(err.notFound);
      done();
    });
  });

  it('Gets buckets', function(done) {
    db.buckets(function(err, data) {
      should.exist(data);
      data.should.include("pb-users");
      should.exist(data.indexOf("users"));
      done();
    });
  });

  it("Gets bucket properties", function(done) {
    db.getBucket('users', function(err, properties, meta) {
      console.log(properties)
      should.exist(properties);
      properties.n_val.should.equal(3);
      should.exist(properties.allow_mult)
      done();
    });
  });

  it("Saves bucket properties", function(done) {
    db.getBucket('users', function(err, properties, meta) {
      var allow_mult = properties.allow_mult;
      db.saveBucket('users', {allow_mult: !allow_mult}, function(err) {
        should.exist(!allow_mult);
        done();
      });
    });
  })

  it("Pings", function(done) {
    db.ping(function(err, pong) {
      should.exist(pong)
      done();
    });
  });

  it("Doesn't set notFound on ping", function(done) {
    db.ping(function(err, pong) {
      should.not.exist(err);
      done();
    })
  });

  it("Doesn't set notFound on save", function(done) {
    db.save('users', 'paul', {}, function(err) {
      should.not.exist(err);
      done();
    });
  });

  it("Fetches keys", function(done) {
    db.save('pb-users', 'user1@gmail.com', {name: 'Joe Example'}, {content_type: "application/json"}, function(data) {
      db.save('pb-users', 'user2@gmail.com', {name: 'Joe Example'}, {content_type: "application/json"}, function(data) {
        db.save('pb-users', 'user3@gmail.com', {name: 'Joe Example'}, {content_type: "application/json"}, function(data) {
          db.save('pb-users', 'user4@gmail.com', {name: 'Joe Example'}, {content_type: "application/json"}, function(data) {
            var keys = db.keys('pb-users', {keys: 'stream'});
            var result = []
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
