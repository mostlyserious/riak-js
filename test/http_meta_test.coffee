assert = require 'assert'
Meta   = require '../lib/http_meta'

keyed = new Meta { bucket: 'bucket', key: 'key' }
assert.equal "/riak/bucket/key", keyed.path

assert.deepEqual ['r', 'w', 'dw', 'rw', 'keys', 'props', 'vtag', 'returnbody', 'chunked'], Meta.queryProperties

queryProps =
  bucket: 'bucket'
  key: 'key'
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

withQueryProps = new Meta queryProps
assert.equal "/riak/bucket/key?r=1&w=2&dw=2&rw=2&keys=true&props=false&vtag=asweetvtag&returnbody=true&chunked=true", withQueryProps.path