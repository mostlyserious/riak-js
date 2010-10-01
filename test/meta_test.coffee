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

keyless = new Meta 'bucket'
assert.equal '/riak/bucket/', keyless.url

keyed = new Meta 'bucket', 'key'
assert.equal '/riak/bucket/key', keyed.url
assert.deepEqual {}, keyed.queryProps
assert.equal "", keyed.queryString
assert.equal "/riak/bucket/key", keyed.path

assert.deepEqual ['r', 'w', 'dw', 'rw', 'keys', 'props',
'vtag', 'nocache', 'returnbody', 'chunked'], Meta.queryProperties

assert.deepEqual ['contentType', 'vclock', 'lastMod', 'lastModUsecs',
  'charset', 'contentEncoding', 'statusCode', 'links', 'etag',
  'raw', 'nocache', 'clientId', 'data', 'host', 'r', 'w',
  'dw', 'rw', 'keys', 'props', 'vtag', 'nocache', 'returnbody', 'chunked'], Meta.riakProperties

queryProps =
  r: 1
  w: 2
  dw: 2
  rw: 2
  keys: true
  props: false
  vtag: 'asweetvtag'
  returnbody: true
  chunked: true

stringifiedQueryProps =
  r: '1'
  w: '2'
  dw: '2'
  rw: '2'
  keys: 'true'
  props: 'false'
  vtag: 'asweetvtag'
  returnbody: 'true'
  chunked: 'true'

withQueryProps = new Meta 'bucket', 'key', queryProps
assert.deepEqual stringifiedQueryProps, withQueryProps.queryProps
assert.equal "r=1&w=2&dw=2&rw=2&keys=true&props=false&vtag=asweetvtag&returnbody=true&chunked=true", withQueryProps.queryString
assert.equal "/riak/bucket/key?r=1&w=2&dw=2&rw=2&keys=true&props=false&vtag=asweetvtag&returnbody=true&chunked=true", withQueryProps.path