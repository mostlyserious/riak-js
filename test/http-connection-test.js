var HttpClient = require('../lib/http-client'),
  HttpMeta = require('../lib/http-meta'),
  seq = require('seq'),
  util = require('util'),
  assert = require('assert'),
  test = require('../lib/utils').test;

var db = new HttpClient({ port: 64208 });

seq().
  seq(function() {
    test("Connection to an unavailable port shouldn't fail the process");
    db.get('users', 'test', function(err) {
      assert.ok(err);
      this.ok();
    }.bind(this));
  });
