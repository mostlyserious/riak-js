var assert = require('assert'),
  test = require('../lib/utils').test,
  Mapper = require('../lib/mapper');

test('Does not have any phases when initialized');

var mapper = new Mapper('airlines');

assert.deepEqual(mapper.phases, []);
assert.equal(mapper.inputs, 'airlines');

test('Phases are added correctly');

var job = mapper
  .map('Riak.mapValuesJson', 'abc')
  .link({ bucket: 'flights', keep: false, language: 'english' })
  .reduce(function() { return 1 + 1 });
  
assert.equal(job.phases.length, 3);
assert.deepEqual(job.phases[0].map, { name: 'Riak.mapValuesJson', arg: 'abc', language: 'javascript' });
assert.deepEqual(job.phases[1].link, { bucket: 'flights', keep: false, language: 'english' });
assert.equal(job.phases[2].reduce.source, "function () { return 1 + 1 }");
assert.equal(job.phases[2].reduce.language, 'javascript');

// the `run` function depends on a client, so will be tested there instead

assert.equal(mapper.client, undefined);