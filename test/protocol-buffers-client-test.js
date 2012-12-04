var ProtocolBuffersClient = require('../lib/protocol-buffers-client'),
  seq = require('seq'),
  util = require('util'),
  assert = require('assert'),
  test = require('../lib/utils').test;

var db = new ProtocolBuffersClient();

seq().
  seq(function() {
    test('Save an object');
    db.save('pb-users', 'user@gmail.com', "{name: 'Joe Example'}", {}, function(data) {
      console.log(data.errmsg)
      this.ok();
    }.bind(this));
  })
  .seq(function() {
    test('Get an object');
    db.get('pb-users', 'user@gmail.com', {}, function(data) {
      console.log(data);
      this.ok();
    }.bind(this));
  })
  .seq(function() {
    db.end();
  })
  .catch(function(err) {
    console.log(err.stack);
    process.exit(1);
  });
