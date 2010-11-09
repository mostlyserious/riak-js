assert = require 'assert'
bucket = 'riakjs_http'

keys = []
meta = {}

module.exports =

  batches: (db) -> [{
      
    'server info request':
      topic: ->
        db.serverInfo @callback
      
      'returns info': (data) ->
        assert.equal 'riak@127.0.0.1', data.node
        assert.ok data.serverVersion.match(/\d+\.\d+/)
        
    'processKeysResponse 1':
      topic: ->
        db.processKeysResponse {errcode: 1}, keys, meta, @callback
      
      'has an errcode': (data) ->
        assert.equal 1, data.errcode
        
    'multiple RpbListKeysResp messages':
      topic: ->
        db.processKeysResponse {keys: [1]}, keys, meta, @callback
      
      'does not call back': (data) ->
        # should never reach here
        assert.fail true
      
    'processKeysResponse 2':
      topic: ->
        db.processKeysResponse {keys: [2], done: true}, keys, meta, @callback
      
      'gets keys back': (data) ->
        assert.deepEqual [1,2], data
    
    'RpbMapRedResp error':
      topic: -> 
        resp = phases: []
        db.processMapReduceResponse {errcode: 1}, resp, meta, @callback
        
      'errcode is 1': (data) ->
        assert.equal 1, data.errcode
        
    'multiple RpbMapRedResp messages':
      topic: ->
        db.processMapReduceResponse {phase: 0, response: "[1]"}, resp, meta, @callback
        
      'does not call back': (data) ->
        # should never reach here
        assert.fail true
        
    'processMapReduceResponse 1':
      topic: ->
        db.processMapReduceResponse {phase: 1, response: "[1]"}, resp, meta, @callback
        
      'does not call back': (data) ->
        # should never reach here
        assert.fail true
    
    'processMapReduceResponse 2':
      topic: ->
        db.processMapReduceResponse {phase: 0, response: "[2]", done: true}, resp, meta, @callback
        
      'returns response': (data) ->
        assert.deepEqual [0, 1], data.phases
        assert.deepEqual [1, 2], data[0]
        assert.deepEqual [1],    data[1]
        
    'buckets request':
      topic: ->
        db.buckets @callback
      
      'returns buckets': (buckets) ->
        # DRY!
        for bucket in [
            'riakjs_airlines'
            'riakjs_airports'
            'riakjs_flights'
          ] then assert.ok (bucket in buckets)
          
}]