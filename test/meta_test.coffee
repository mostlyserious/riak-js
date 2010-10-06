assert = require 'assert'
Meta   = require '../lib/meta'

empty = new Meta { bucket: 'bucket', key: 'empty' }
assert.equal 'bucket',           empty.bucket
assert.equal 'empty',            empty.key
assert.equal null,               empty.vclock
assert.equal 'application/json', empty.contentType
assert.equal false,              empty.binary

full = new Meta
  bucket: 'bucket'
  key: 'full'
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

keyless = new Meta { bucket: 'bucket' }
assert.notEqual 'abc', keyless.usermeta.custom
assert.equal undefined, keyless.key

# test meta is the same
copy = new Meta full
assert.equal full, copy
assert.ok copy instanceof Meta

# assert.deepEqual ['bucket', 'key', 'contentType', 'vclock', 'lastMod', 'lastModUsecs',
#   'charset', 'contentEncoding', 'statusCode', 'links', 'etag',
#   'raw', 'clientId', 'data', 'host', 'r', 'w',
#   'dw', 'rw'], Meta.riakProperties