var Meta = require('../lib/meta'),
  assert = require('assert'),
  test = require('../lib/utils').test;

test('Sets its attributes');

var meta = new Meta({ bucket: 'bucket', key: 'key', contentType: 'png', data: 'd32n92390XMIW0', host: '192.168.1.2', myown: 'field' });

assert.equal(meta.bucket, 'bucket');
assert.equal(meta.key, 'key');
assert.equal(meta.vclock, null);
assert.equal(meta.contentType, 'image/png');
assert.equal(meta.data, 'd32n92390XMIW0');

test('Properly falls back to defaults');

assert.deepEqual(meta.links, Meta.defaults.links);
assert.equal(meta.resource, Meta.defaults.resource);
assert.equal(meta.clientId, Meta.defaults.clientId);
assert.equal(meta.host, '192.168.1.2');

test('Unrecognized properties are ignored');

assert.equal(meta.myown, null);

test('Is able to detect the content type');

meta = new Meta({ data: { a: 1 } });
assert.equal(meta.contentType, 'application/json');

meta = new Meta({ contentType: 'xml', data: '<a>b</a>' })
assert.equal(meta.contentType, 'text/xml');

test("Manual content type setting has priority over detection");

meta.loadData('some text');
assert.notEqual(meta.contentType, 'text/plain');

test("Can be passed multiple option objects, and it mixes in correctly");

meta = new Meta({ bucket: '?', stream: true, key: 'key' }, { bucket: '_', callback: function() { console.log('test') }}, { bucket: 'bucket' });

assert.equal(meta.bucket, 'bucket');
assert.equal(meta.key, 'key');
assert.ok(meta.stream);
assert.equal(meta.callback, 'function () { console.log(\'test\') }')

test("A Meta fed with another Meta results in identity");

var meta = new Meta({ bucket: 'bucket', key: 'key' }),
  meta2 = new Meta(meta);

assert.deepEqual(meta, meta2);

//       keyless.addLink { bucket: 'bucket', key: 'test' }
//       keyless.addLink { bucket: 'bucket', key: 'test2', tag: '_' }
//       keyless.addLink { bucket: 'bucket', key: 'test', tag: 'tag' }
//       
//       # dupes
//       keyless.addLink { bucket: 'bucket', key: 'test' }
//       keyless.addLink { bucket: 'bucket', key: 'test', tag: 'tag' }
//       keyless.addLink { bucket: 'bucket', key: 'test2', tag: '_' }
//       keyless.addLink { bucket: 'bucket', key: 'test2' } # no tag or '_' are equivalent
//       
//     'duplicate links are ignored': (keyless) ->
//       assert.deepEqual keyless.links, [
//         { bucket: 'bucket', key: 'test' }
//         { bucket: 'bucket', key: 'test2', tag: '_' }
//         { bucket: 'bucket', key: 'test', tag: 'tag' }
//       ]
//     
//     'links can be removed': (keyless) ->
//       keyless.removeLink { bucket: 'bucket', key: 'test' }
//       assert.equal keyless.links.length, 2
//       keyless.removeLink { bucket: 'bucket', key: 'test', tag: 'tag' }
//       assert.equal keyless.links.length, 1
//       keyless.removeLink { bucket: 'bucket', key: 'test2' } # should treat tag '_' as non-existent
//       assert.equal keyless.links.length, 0