seq = require 'seq'
assert = require 'assert'
db = require('../../src/index').getClient({ api: 'http', debug: false })

bucket = 'riakjs_http'
print = (message) -> console.log "=> " + message

seq([1,2,3,4])

  .flatten(fully = false)

  .parEach (number) ->
    print "saving doc number #{number}"
    db.save bucket, "#{number}", { test: 'yes', number: number }, @

  .seq ->
    buffer = []
    stream = db.keys bucket, { keys: 'stream' } , -> # noop, i don't care about props
    stream.on 'keys', (keys) -> buffer = buffer.concat(keys)
    stream.on 'end', =>
      assert.deepEqual buffer.sort(), [1,2,3,4]
      @(null, buffer)
    stream.start()
  
  .flatten()
    
  .seqEach (key) ->
    print "cleaning up key #{key}"
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