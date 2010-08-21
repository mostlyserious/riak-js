assert = require 'assert'
Mapper = require('../lib/mapper')

m = new Mapper 'riak'

assert.equal 'riak', m.riak # should be a db instance in a real app

assert.deepEqual [], m.phases

mapFunc    = 'Riak.mapValuesJson'
linkFunc   = bucket: 'flights', keep: false, language: 'english'
reduceFunc = ->
  1 + 1

map = m.map(mapFunc, 'abc').
  link(linkFunc).
  reduce(reduceFunc)

assert.equal 3, map.phases.length

assert.deepEqual {name: mapFunc, arg: 'abc', language: 'javascript'}, 
  map.phases[0].map

assert.deepEqual linkFunc, map.phases[1].link

assert.equal reduceFunc.toString(), map.phases[2].reduce.source
assert.equal 'javascript',          map.phases[2].reduce.language

job = map.job 'airlines', method: 'PUT', abc: 'def'
assert.equal 'PUT',          job.method
assert.equal 'def',          job.abc
assert.equal 'airlines',     job.data.inputs
assert.deepEqual map.phases, job.data.query