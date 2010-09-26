assert = require 'assert'
Meta   = require('../lib/meta')

empty = new Meta 'bucket', 'empty'
assert.equal 'bucket',           empty.bucket
assert.equal 'empty',            empty.key
assert.equal null,               empty.vclock
assert.equal 'application/json', empty.contentType
assert.equal false,              empty.binary

full = new Meta 'bucket', 'full', 
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