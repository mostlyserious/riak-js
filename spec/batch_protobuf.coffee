assert = require 'assert'
bucket = 'riakjs_http'

keys = []
meta = {}

module.exports =

  batches: (db) -> [{
        
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