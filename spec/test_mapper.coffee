vows = require 'vows'
assert = require 'assert'
mapper = new(require '../src/mapper')('riak')

vows.describe('Mapper').addBatch(

  'a mapper instance':
    topic: -> mapper
    
    'has an associated db instance': (mapper) ->
      assert.equal mapper.riak, 'riak'
      
    'does not have any phases when empty': (mapper) ->
      assert.deepEqual mapper.phases, []
      
    'when phases are added':
    
      topic: ->
        
        @mapFunc = 'Riak.mapValuesJson'
        @linkFunc = { bucket: 'flights', keep: false, language: 'english' }
        @reduceFunc = -> 1 + 1
        
        @map = mapper
          .map(@mapFunc, 'abc')
          .link(@linkFunc)
          .reduce(@reduceFunc)
      
      'has 3 phases': (map) ->
        assert.length map.phases, 3

      'first phase is map': (map) ->
        assert.deepEqual {name: @mapFunc, arg: 'abc', language: 'javascript'}, map.phases[0].map
        
      'second phase is link': (map) ->
        assert.deepEqual @linkFunc, map.phases[1].link
        
      'third phase is reduce': (map) ->
        assert.equal @reduceFunc.toString(), map.phases[2].reduce.source
        assert.equal 'javascript', map.phases[2].reduce.language
        
      'and is turned into a job':
        topic: -> @map.job 'airlines', method: 'PUT', abc: 'def'
        
        'has its inputs and phases set': (job) ->
          assert.equal 'airlines', job.data.inputs
          assert.deepEqual @map.phases, job.data.query
          assert.equal 'PUT', job.method
          assert.equal 'def', job.abc

).export module