var HttpClient = require('../lib/http-client'),
  HttpMeta = require('../lib/http-meta'),
  async = require('async'),
  util = require('util'),
  should = require('should');

var db, db2, many = [], bucket;

/* Tests */

describe('http-client-tests', function() {
  before(function(done) {
    db = new HttpClient({ port: 8098 });
    db2 = new HttpClient({ port: 64208 });
    for (var i = 0; i < 600; i++) {
      many.push(String(i));
    }
    // Ensure unit tests don't collide with pre-existing buckets
    bucket = 'users-riak-js-tests';

    done();
  });

  it('Save with returnbody', function(done) {
    db.save(bucket, 'test-returnbody@gmail.com',
      { email: 'test@gmail.com',
        name: 'Testy Test',
        a: [1, 2],
        returnbody: 'yes please' },
      { returnbody: true },
      function(err, data, meta) {
        should.not.exist(err);
        meta.statusCode.should.equal(200);
        should.exist(data);
        data.a.should.eql([1, 2]);
        meta.key.should.equal('test-returnbody@gmail.com');

        done();
      });
  });

  it('Save', function(done) {
    db.save(bucket, 'test@gmail.com', 'Some text', function(err, data, meta) {
      should.not.exist(err);
      should.not.exist(data);
      meta.key.should.equal('test@gmail.com');

      done();
    });
  });

  it('Get with no options', function(done) {
    db.get(bucket, 'test@gmail.com', function(err, document) {
      should.not.exist(err);
      should.exist(document);
      document.should.equal('Some text');

      done();
    });
  });

  it('Store plain text with unicode in it', function(done) {
    db.save(bucket, 'text-with-unicode', 'tét', function(err) {
      should.not.exist(err);

      db.get(bucket, 'text-with-unicode', function(err, document) {
        should.not.exist(err);
        should.exist(document);
        new Buffer(document).length.should.equal(4);
        document.should.equal('tét');

        done();
      });
    });
  });

  it('Get all', function(done) {
    db.getAll(bucket, function(err, documents) {
      should.not.exist(err);
      should.exist(documents);
      documents.should.be.an.instanceof(Array);
      // TODO get this to properly match expected contents
      //documents.should.includeEql('some text');

      done();
    });
  });

  it('Head Request', function(done) {
    db.head(bucket, 'test@gmail.com', function(err, data, meta) {
      should.not.exist(err);
      should.not.exist(data);
      should.exist(meta);
      meta.statusCode.should.equal(200);

      done();
    });
  });

  it('Storing document with links', function(done) {
    db.save(bucket, 'other@gmail.com',
      { name: 'Other Dude' },
      { links: [
        { bucket: bucket, key: 'test@gmail.com' }
      ]}, function(err, data, meta) {
        should.not.exist(err);
        should.not.exist(data);
        should.exist(meta);
        meta.statusCode.should.equal(204);

        done();
      });
  });

  it('Fetching a document with links', function(done) {
    db.get(bucket, 'other@gmail.com', function(err, data, meta) {
      should.not.exist(err);
      should.exist(data);
      should.exist(meta);
      meta.links.length.should.equal(1);
      meta.links[0].tag.should.equal('_');

      done();
    });
  });

  it('Populates the links when saving an object', function(done) {
    db.save(bucket, 'other@gmail.com',
      { name: 'Other Dude' },
      { links: [
        { bucket: bucket, key: 'test@gmail.com' }
      ]}, function(err, data, meta) {
        should.exist(meta.links);
        meta.links.should.have.length(1)

        done();
      });

  });

  it('Fetch via Linkwalk', function(done) {
    db.walk(bucket, 'other@gmail.com', [
      {bucket: bucket}
    ],
      function(err, data, meta) {
        should.not.exist(err);
        should.exist(data);
        data.length.should.equal(1);
        data[0].length.should.equal(1);
        should.exist(data[0][0].meta);
        should.exist(data[0][0].data);

        done();
      });
  });

  it('Vector clock not overwritten on link walk', function(done) {
    db.walk(bucket, 'other@gmail.com', [
      {bucket: bucket}
    ],
      function(err, data, meta) {
        should.not.exist(err);
        should.exist(data);
        data.length.should.equal(1);
        data[0].length.should.equal(1);
        should.exist(data[0][0].meta);
        should.exist(data[0][0].data);
        should.exist(data[0][0].meta.vclock);

        done();
      });
  });

  it('Reusing meta object', function(done) {
    db.get(bucket, 'test@gmail.com', function(err, data, meta) {
      should.not.exist(err);
      should.exist(data);
      should.exist(meta);

      db.save(bucket, 'test@gmail.com', data, meta, function(err, data, meta) {
        should.not.exist(err);
        should.exist(meta);
        meta.statusCode.should.equal(204);

        done();
      });
    });
  });

  it('Remove document', function(done) {
    db.remove(bucket, 'test@gmail.com', function(err, data, meta) {
      should.not.exist(err);
      should.exist(meta);
      meta.statusCode.should.equal(204);

      done();
    });
  });

  it('Document exists', function(done) {
    db.exists(bucket, 'test@gmail.com', function(err, data, meta) {
      should.not.exist(err);
      data.should.equal(false);
      should.exist(meta);
      meta.statusCode.should.equal(404);

      done();
    });
  });

  it('Get non-existent document', function(done) {
    db.get(bucket, 'test@gmail.com', function(err, data, meta) {
      should.exist(err);
      should.exist(data);
      data.notFound.should.equal(true);
      should.exist(meta);
      meta.statusCode.should.equal(404);

      done();
    });
  });

  it('Get non-existent document, ignoring not found error', function(done) {
    db.get(bucket, 'test@gmail.com', { noError404: true },
      function(err, data, meta) {
        should.not.exist(err);
        should.exist(data);
        data.statusCode.should.equal(404);
        should.exist(meta);
        meta.statusCode.should.equal(404);

        done();
      });
  });

  it('Ensure a second riak-js instance does not inherit settings from the first one', function(done) {
    db2.get(bucket, 'test@gmail.com', function(err, data, meta) {
      should.exist(err);
      should.not.exist(data);
      should.not.exist(meta);

      done();
    });
  });

  it('Save with returnbody=true actually returns the body', function(done) {
    db.save(bucket, 'test2@gmail.com',
      { user: 'test2@gmail.com' },
      { returnbody: true },
      function(err, data, meta) {
        should.not.exist(err);
        should.exist(data);
        data.should.eql({ user: 'test2@gmail.com' });

        done();
      });
  });

  it('Stream Keys', function(done) {
    async.forEachLimit(many, 10, function(key, next) {
      db.save(bucket + '-keys', key, key, function(err) {
        should.not.exist(err);
        next();
      });
    }, function() {
      var buf = [],
        keys = function(keys) {
          buf = buf.concat(keys)
        },
        end = function() {
          // keys come in random order, need to sort
          // both arrays by string in order to compare
          buf = buf.sort();
          many = many.sort();
          many.should.eql(buf);
          done();
        };

      db.keys(bucket + '-keys')
        .on('keys', keys)
        .on('end', end)
        .start();
    });
  });

  it('Count Keys', function(done) {
    db.count(bucket + '-keys', function(err, total) {
      should.not.exist(err);
      should.exist(total);
      total.should.equal(many.length);

      done();
    });
  });

  it('Secondary Indices', function(done) {
    db.save(bucket, 'fran@gmail.com',
      { age: 28 },
      { index: { age: 28, alias: 'fran' } },
      function(err, data, meta) {
        should.not.exist(err);
        async.parallel([
          function(callback) {
            db.query(bucket, { age: [20, 30] }, function(err, results) {
              should.not.exist(err);
              should.exist(results);
              results.length.should.equal(1);
              results[0].should.equal('fran@gmail.com');

              callback();
            });
          }, function(callback) {
            db.query(bucket, { alias: 'fran' }, function(err, results) {
              should.not.exist(err);
              should.exist(results);
              results.length.should.equal(1);
              results[0].should.equal('fran@gmail.com');

              callback();
            });
          }], function() {
          done();
        });
      });
  });

  it('Buckets is an Array', function(done) {
    db.buckets(function(err, buckets) {
      should.not.exist(err);
      should.exist(buckets);
      buckets.should.be.an.instanceof(Array);

      done();
    });
  });

  it('Get the properties of a bucket', function(done) {
    db.buckets(function(err, buckets) {
      should.not.exist(err);
      should.exist(buckets);
      buckets.should.be.an.instanceof(Array);

      var bucket = buckets[0];

      db.getBucket(bucket, function(err, data) {
        should.not.exist(err);
        should.exist(data);
        should.exist(data.r);

        done();
      });
    });
  });

  it('List Resources', function(done) {
    db.resources(function(err, resources) {
      should.not.exist(err);
      should.exist(resources);
      should.exist(resources.riak_kv_wm_buckets);

      done();
    });
  });

  it('Ping', function(done) {
    db.ping(function(err, pong) {
      should.not.exist(err);
      should.exist(pong);

      done();
    });
  });

  it('Stats', function(done) {
    db.stats(function(err, stats) {
      should.not.exist(err);
      should.exist(stats);
      should.exist(stats.riak_core_version);

      done();
    });
  });

  it('Custom Meta', function(done) {
    var meta = new CustomMeta();
    db.get(bucket, 'test2@gmail.com', meta, function(err, document) {
      should.not.exist(err);
      should.exist(document);
      document.intercepted.should.equal(true);

      done();
    });
  });
});

/* Custom Meta */

var CustomMeta = function() {
  var args = Array.prototype.slice.call(arguments);
  HttpMeta.apply(this, args);
}

util.inherits(CustomMeta, HttpMeta);

CustomMeta.prototype.parse = function(data) {
  var result = HttpMeta.prototype.parse.call(this, data);
  if (result instanceof Object) result.intercepted = true;
  return result;
}
