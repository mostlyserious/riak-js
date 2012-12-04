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
    test('Save with returnbody');
    db.save('users', 'test-returnbody@gmail.com', { email: 'test@gmail.com', name: 'Testy Test', a: [1,2], returnbody: 'yes please' }, { returnbody: true }, function(err, data, meta) {
      assert.equal(meta.statusCode, 200);
      assert.ok(data);
      assert.deepEqual(data.a, [1,2]);
      assert.equal(meta.key, 'test-returnbody@gmail.com');
      this.ok();
    }.bind(this));
  })

  .seq(function() {
    test('Save');
    db.save('users', 'test@gmail.com', "Some text", function(err, data, meta) {
      assert.equal(meta.statusCode, 204);
      assert.ok(!data);
      assert.equal(meta.key, 'test@gmail.com');
      this.ok();
    }.bind(this));
  })

  .seq(function() {
    test('Get with no options or callback');
    db.get('users', 'test@gmail.com', this);    
  })
  .seq(function(doc2) {
    assert.equal(doc2, "Some text");
    this.ok();
  })
  
  .seq(function() {
    test('Store plain text with unicode in it');
    db.save('users', 'text-user', 'tét', function() {
      db.get('users', 'text-user', this);
    }.bind(this));
  })
  .seq(function(text) {
    assert.equal(new Buffer(text).length, 4);
    assert.equal(text, 'tét');
    this.ok();
  })
  .seq(function() {
    test("Get all");
    db.getAll('users', this);
  })

  .seq(function(users) {
    assert.ok(Array.isArray(users));
    assert.ok(users.some(function(u) { return u == "Some text" }));
    this.ok();
  })
  
  .seq(function() {
    test('Head request');
    db.head('users', 'test@gmail.com', function(err, data, meta) {
      assert.ok(!err && !data);
      assert.ok(meta.statusCode === 200);
      this.ok();
    }.bind(this));
  })
  
  .seq(function() {
    test('Storing document with links');
    db.save('users', 'other@gmail.com', {name: "Other Dude"}, {links: [{bucket: 'users', key: 'test@gmail.com'}]}, function(erro, data, meta) {
      assert.ok(meta.statusCode === 204);
      this.ok();
    }.bind(this));
  })
  .seq(function() {
    test('Fetching a document with links');
    db.get('users', 'other@gmail.com', function(err, data, meta) {
      this.ok(meta);
    }.bind(this));
  })
  .seq(function(meta) {
    test('Includes links in the meta object');
    assert.equal(meta.links.length, 1);
    this.ok(meta);
  })
  .seq(function(meta) {
    test("Doesn't store undefined for empty tags");
    assert.equal(meta.links[0].tag, '_');
    this.ok();
  })
  .seq(function(){
    test("Fetch via Linkwalk");
    db.walk('users', 'other@gmail.com', [{bucket: 'users'}], function(err, data, meta){
      assert.equal(data.length, 1);
      assert.equal(data[0].length, 1);
      assert.ok(data[0][0].meta);
      assert.ok(data[0][0].data);
      this.ok();
    }.bind(this));
  })
  .seq(function() {
    test("Vector clock not overwritten on link walk");
    db.walk('users', 'other@gmail.com', [{bucket: 'users'}], function(err, data, meta) {
      assert.ok(data[0][0].meta.vclock);
      this.ok();
    }.bind(this));
  })
  .seq(function() {
    test('Reusing meta object');
    db.get('users', 'test@gmail.com', function(err, data, meta) {
      this.ok(data, meta);
    }.bind(this));
  })
  .seq(function(user, meta) {
    db.save('users', 'test@gmail.com', user, meta, function(err, data, meta) {
      this.ok(meta);
    }.bind(this));
  })
  .seq(function(meta) {
    assert.equal(meta.statusCode, 204);
    this.ok();
  })
  .seq(function() {
    test('Remove document');
    db.remove('users', 'test@gmail.com', function(err, data, meta) {
      assert.equal(meta.statusCode, 204);
      this.ok();
    }.bind(this));
  })

  .seq(function() {
    test('Document exists');
    db.exists('users', 'test@gmail.com', function(err, does, meta) {
      assert.equal(meta.statusCode, 404);
      assert.equal(does, false);
      this.ok();
    }.bind(this));
  })

  .seq(function() {
    test('Get non-existent document');
    db.get('users', 'test@gmail.com', function(err, does, meta) {
      assert.equal(err.message, 'not found');
      assert.equal(meta.statusCode, 404);
      this.ok();
    }.bind(this));
  })
  
  .seq(function() {
    test('Get non-existent document, ignoring the not found error');
    db.get('users', 'test@gmail.com', { noError404: true }, this);
    // no error should be returned
  })


  .seq(function() {
    test('Ensure a second riak-js instance does not inherit settings from the first one');
    
    // we're expecting this instance to be down (listening on port 64208)
    db2.on('error', function(err) {
      assert.ok(err);
      this.ok();
    }.bind(this));
    
    db2.get('users', 'test@gmail.com');
  })
  
  .seq(function() {
    test('Save with returnbody=true actually returns the body');
    db.save('users', 'test2@gmail.com', { user: 'test2@gmail.com' }, { returnbody: true }, this);
  })
  .seq(function(doc) {
    assert.ok(doc);
    assert.equal(doc.user, 'test2@gmail.com');
    setTimeout(this.ok, 3000); // wait for damn dead horse riak; see https://issues.basho.com/show_bug.cgi?id=1269
  })
  
  .set(many)
  .flatten()
  .parEach(20, function(key) {
    db.save('test', key, key, this);
  })
  
  .seq(function() {
    test("Stream keys");
    var buf = [],
      keys = function(keys) { buf = buf.concat(keys) },
      end = function() {
        // keys come in random order, need to sort both arrays by string in order to compare
        buf = buf.sort(); many = many.sort();
        assert.deepEqual(many, buf);
        this.ok();
      }.bind(this);

    db
      .keys('test')
      .on('keys', keys)
      .on('end', end)
      .start();
  })
  
  .seq(function() {
    test("Count keys");
    db.count('test', this);
  })
  .seq(function(total) {
    assert.equal(total, many.length);
    this.ok();
  })
  .seq(function() {
    test("Secondary indices");
    db.save('users', 'fran@gmail.com', { age: 28 }, { index: { age: 28, alias: 'fran' } }, this);
  })
  .seq(function() {
    db.query('users', { age: [20,30] }, this);
  })
  .seq(function(keys) {
    assert.equal(keys[0], 'fran@gmail.com');
    this.ok();
  })
  .seq(function() {
    db.query('users', { alias: 'fran' }, this);
  })
  .seq(function(keys) {
    assert.equal(keys[0], 'fran@gmail.com');
    this.ok();
  })
  
  .seq(function() {
    test('Buckets is an Array');
    db.buckets(this);
  })
  .seq(function(buckets) {
    assert.ok(Array.isArray(buckets));
    this.ok(buckets);
  })
  
  .seq(function(buckets) {
    test('Get the properties of a bucket');
    var bucket = buckets[0];
    db.getBucket(bucket, this);
  })
  .seq(function(props) {
    assert.ok(props && props.r);
    this.ok()
  })
  
  .seq(function() {
    test("List resources");
    db.resources(this);
  })
  .seq(function(resources) {
    assert.ok(resources && resources.riak_kv_wm_buckets);
    this.ok();
  })
  
  .seq(function() {
    test('Ping');
    db.ping(this);
  })
  .seq(function(pong) {
    assert.ok(pong);
    this.ok()
  })
  
  .seq(function() {
    test('Stats');
    db.stats(this);
  })
  .seq(function(stats) {
    assert.ok(stats.riak_core_version);
    this.ok();
  })
  
  .seq(function() {
    test('Custom Meta');
    var meta = new CustomMeta();
    db.get('users', 'test2@gmail.com', meta, this);
  })
  .seq(function(user) {
    assert.equal(user.intercepted, true);
    this.ok();
  })
  .catch(function(err) {
    console.log(err.stack);
    process.exit(1);
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
