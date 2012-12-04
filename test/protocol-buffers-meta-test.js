var Meta = require('../lib/protocol-buffers-meta'),
  test = require('../lib/utils').test,
  assert = require('assert');

var meta = new Meta({bucket: 'bucket', key: 'key', contentType: 'png', data: 'asdfdsfaslj'});

var response = {
  content: [{
    value: 'Joe Example',
    vtag: '4SDUsFbniqHEYsPO6kbEwk',
    last_mod: 1354021798,
    last_mod_usecs: 692437,
    content_type: 'text/plain'
  }],
  vclock: "4SDUsFbniqHEYsPO6kbEwkklajsf4SDUsFbniqHEYsPO6kbEwk"
};

meta.loadResponse(response);

test('Load response');
assert.equal(meta.contentType, "text/plain");
assert.equal(new Date(meta.lastMod).getTime(), 1354021798);
assert.ok(meta.vclock);

test('Load response with serialized data');

response = {
  content: [{
    value: '{"name": "Joe Example"}',
    vtag: '4SDUsFbniqHEYsPO6kbEwk',
    last_mod: 1354021798,
    last_mod_usecs: 692437,
    content_type: 'application/json'
  }]
};
