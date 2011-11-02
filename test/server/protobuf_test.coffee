seq = require 'seq'
assert = require 'assert'
db = require('../../src/index').getClient({ api: 'protobuf', debug: false })

bucket = 'riakjs_protobuf'
print = (message) -> console.log "=> " + message

seq([1,2,3,4])

  .flatten(fully = false)

  .parEach (number) ->
    print "saving doc number #{number}"
    db.save bucket, "#{number}", { test: 'yes', number: number }, @

  .seq ->
    print 'retrieving that doc'
    db.get bucket, '1', @

  .seq (contents) ->
    print 'document matches what saved'
    assert.deepEqual(contents, { test: 'yes', number: 1})
    @()

  .seq ->
    print 'gimme all buckets'
    db.buckets @

  .seq (buckets) ->
    print "our bucket #{bucket} is in the list of buckets"
    assert.ok(bucket in buckets)
    @()

  .seq ->
    print 'now lets map/reduce the hell out of it'
    db.add(bucket).map((v) -> v = Riak.mapValuesJson(v)[0]; if 1 < v.number < 4 then [v] else []).run(@)

  .seq (results) ->
    print "this stuff should be in by now"
    assert.deepEqual results, [[{ test: 'yes', number: 2 }, { test: 'yes', number: 3 }]]
    @()
    
  .seq ->
    print 'now gimme all keys'
    db.keys bucket, @

  .seq (keys) ->
    print 'see if our doc is there...'
    assert.ok('1' in keys)
    @(null, keys)

  .flatten()

  .seqEach (key) ->
    print 'cleaning up key '+ key
    db.remove bucket, key, @

  .seq ->
    db.buckets @

  .seq (buckets) ->
    print 'bucket shouldnt exist anymore'
    assert.ok(bucket not in buckets)
    @()

  .seq ->
    print "[result] 's all good"
    db.end()

  .catch (err) ->
    print 'omg we fucked up'
    console.dir err
    db.end()