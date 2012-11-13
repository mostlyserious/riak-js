var HttpClient = require('../lib/http-client'),
  HttpMeta = require('../lib/http-meta'),
  seq = require('seq'),
  util = require('util'),
  assert = require('assert'),
  test = require('../lib/utils').test;

var db = new HttpClient({ port: 8098 });
var events = []

var listener = {
  "request.start": function(event) {
    events.push(event)
  }
}

seq()
.seq(function() {
  test('Register event listeners');
  db.registerListener(listener);
  this.ok();
})
.seq(function() {
  test('Creates an object');
  db.save('users', 'someone@gmail.com', {name: 'Someone Else'}, function() {
    this.ok(events[0]);
  }.bind(this));
})
.seq(function(event) {
  test('Assigns a unique ID to a request');
  assert.notEqual(event.uuid, undefined);
  this.ok(event);
});
