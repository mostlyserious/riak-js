assert = require 'assert'
Meta   = require('../src/meta')

empty = new Meta 'bucket', 'empty'
assert.equal 'bucket',           empty.bucket
assert.equal 'empty',            empty.key
assert.equal null,               empty.vclock
assert.equal 'application/json', empty.content_type
assert.equal false,              empty.binary

full = new Meta 'bucket', 'full', 
  content_type: 'png'
  vclock:       123
  custom:       'abc'

assert.equal 'bucket',    full.bucket
assert.equal 'full',      full.key
assert.equal 123,         full.vclock
assert.equal 'image/png', full.content_type
assert.equal 'abc',       full.options.custom
assert.equal true,        full.binary

full.content_type = 'xml'
assert.equal 'text/xml', full.content_type
assert.equal false,      full.binary