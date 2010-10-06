assert = require 'assert'
Meta   = require '../lib/meta'

# test empty/defaults

empty = new Meta 'bucket', 'empty'
assert.equal 'bucket',           empty.bucket
assert.equal 'empty',            empty.key
assert.equal null,               empty.vclock
assert.equal 'application/json', empty.contentType
assert.equal false,              empty.binary
assert.deepEqual empty.links, Meta.defaults.links
assert.equal empty.raw, Meta.defaults.raw
assert.equal empty.clientId, Meta.defaults.clientId
assert.equal empty.host, Meta.defaults.host

full = new Meta 'bucket', 'full'
  contentType: 'png'
  vclock:      123
  custom:      'abc'

assert.equal 'bucket',    full.bucket
assert.equal 'full',      full.key
assert.equal 123,         full.vclock
assert.equal 'image/png', full.contentType
assert.equal 'abc',       full.usermeta.custom
assert.equal true,        full.binary

full.contentType = 'xml'
assert.equal 'text/xml', full.contentType
assert.equal false,      full.binary

keyless = new Meta 'bucket'
keyless.addLink { bucket: 'bucket', key: 'test' }
assert.notEqual 'abc', keyless.usermeta.custom
assert.equal undefined, keyless.key
assert.deepEqual keyless.links, [ { bucket: 'bucket', key: 'test' } ]
keyless.removeLink { bucket: 'bucket', key: 'test' }
assert.equal keyless.links.length, 0

# test meta is the same
copy = new Meta full
assert.equal full, copy
assert.ok copy instanceof Meta

# assert.deepEqual ['bucket', 'key', 'contentType', 'vclock', 'lastMod', 'lastModUsecs',
#   'charset', 'contentEncoding', 'statusCode', 'links', 'etag',
#   'raw', 'clientId', 'data', 'host', 'r', 'w',
#   'dw', 'rw'], Meta.riakProperties