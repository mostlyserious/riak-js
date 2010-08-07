assert = require 'assert'
Meta   = require('../src/meta')

empty = new Meta('empty')
assert.equal 'empty',            empty.key
assert.equal null,               empty.vclock
assert.equal 'application/json', empty.type
assert.equal false,              empty.binary

full = new Meta('full', type: 'png', vclock: 123, custom: 'abc')
assert.equal 'full',      full.key
assert.equal 123,         full.vclock
assert.equal 'image/png', full.type
assert.equal 'abc',       full.options.custom
assert.equal true,        full.binary

full.type = 'xml'
assert.equal 'text/xml', full.type
assert.equal false,      full.binary