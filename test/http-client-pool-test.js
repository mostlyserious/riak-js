var HttpClient = require('../lib/http-client'),
  HttpMeta = require('../lib/http-meta'),
  seq = require('seq'),
  util = require('util'),
  assert = require('assert'),
  test = require('../lib/utils').test;

var db = new HttpClient({ pool: {
  servers: [
    'localhost:10018', 
    'localhost:10028', 
    'localhost:10038', 
    'localhost:10048'
  ],
  options: {}
}});

seq()
.seq(function() {
  test('Creates an object');
  db.save('languages', 'erlang', {type: 'functional'}, function(err) {
    this.ok();
  }.bind(this));
})
.seq(function() {
  test('Get that object');
  db.get('languages', 'erlang', function(err, data) {
    assert(!err);
    assert.equal(data.type, 'functional');
    console.log(data);
    this.ok();
  }.bind(this));
});
