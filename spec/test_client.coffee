vows = require 'vows'
assert = require 'assert'
api = process.env['RIAKJS_TEST_API'] or 'http'
db = require('../src/index').getClient({ api: api, debug: false })
client = require "./batch_#{api}"

suite = vows.describe "Riak #{api.toUpperCase()} API"

setupBatch =
  
  'suite setup':
    topic: ->
      
      done = @callback
      
      # append client's test data
      for bucket, values of client.data then data[bucket] = values

      queue = []
      for bucket, keys of data
        for key, [value, meta] of keys
          queue.push [bucket, key, value, meta]
          
      queue.forEach (entry, index) ->
        [bucket, key, value, meta] = entry
        
        db.save bucket, key, value, meta, (err) ->
          if index is queue.length-1
            # make sure allow_mult is set to false
            db.updateProps client.bucket, { allow_mult: false }, done
    
    'when get keys':
      topic: ->
        db.keys airports, @callback
      
      'data is present': (keys) ->
        assert.length keys, 8

batches = [{
  
  'a particular meta implementation':
    topic: -> new db.Meta()
    
    'has no links': (meta) ->
      assert.equal meta.links.length, 0
    
    'is of the correct API': (meta) ->
      assert.equal meta.api, api  # api defined above
  
  'ping request':
    topic: ->
      db.ping @callback

    'pings back': (ping) ->
      assert.ok ping
    
  'document 1':
    topic: ->
      db.get airlines, 'KLM', @callback
      
    'is JSON with metadata': (err, air, meta) ->
      assert.equal airlines,                     meta.bucket
      assert.equal 'KLM',                        meta.key
      assert.equal 'application/json',           meta.contentType
      assert.equal 1,                            meta.usermeta.abc
      assert.equal 111,                          air.fleet
      assert.ok meta.vclock?
      
    'returns its links': (err, air, meta) ->
      assert.equal 2,                            meta.links.length
      assert.equal 'riakjs_flights',             meta.links[0].bucket
      assert.equal 'riakjs_flights',             meta.links[1].bucket
      assert.equal 'KLM-8098',                   meta.links[0].key
      assert.equal 'KLM-1196',                   meta.links[1].key
      assert.equal 'flight',                     meta.links[0].tag
      assert.equal 'flight',                     meta.links[1].tag

  # walk is ONLY HTTP for now
  'walk request':
    topic: ->
      db.walk airlines, 'KLM', [["_", "flight"]], @callback

    'returns several flights': (flights) ->
      assert.equal 2, flights.length
      assert.ok flights[0].to in ['JFK', 'AMS']
      assert.ok flights[1].code in ['KLM-8098', 'KLM-1196']      
  
  'document 2':
    topic: ->
      db.get airlines, 'IBE', @callback
    
    'is JSON with metadata': (err, air, meta) ->
      assert.equal 'riakjs_airlines',  meta.bucket
      assert.equal 'IBE',              meta.key
      assert.equal 'application/json', meta.contentType
      assert.equal 1,                  meta.usermeta.abc
      assert.equal 2,                  meta.usermeta.def
      assert.equal 183,                air.fleet
      assert.ok meta.vclock?
      
  'document 3':
    topic: ->
      db.get airlines, 'CPA', @callback

    'is JSON with metadata': (err, air, meta) ->
      assert.equal 'riakjs_airlines',            meta.bucket
      assert.equal 'CPA',                        meta.key
      assert.equal 'application/json',           meta.contentType
      assert.equal 127,                          air.fleet
      assert.ok meta.vclock?

    'returns its links': (err, air, meta) ->
      assert.equal 1,                            meta.links.length
      assert.equal 'riakjs_flights',             meta.links[0].bucket
      assert.equal 'CPA-729',                    meta.links[0].key
      assert.equal 'flight',                     meta.links[0].tag
      
  'flight IBE-4418':
    topic: ->
      db.get flights, 'IBE-4418', @callback
      
    'is present': (flight) ->
      assert.equal 'JFK', flight.from
      
    'when removed':
      topic: ->
        db.remove flights, 'IBE-4418', @callback
        
      'and requested again':
        topic: ->
          db.get flights, 'IBE-4418', @callback
          
        'is not present': (err, flight) ->
          assert.ok err.notFound
          assert.equal 404, err.statusCode
    
  'an invalid map/reduce request':
    topic: ->
      db
        .add(airlines)
        .map(
          (value) ->
            this.should.raise.something
        )
        .run @callback
    
    'returns status 500': (err, response) ->
      assert.equal 500, err.statusCode
      # not possible to get meta (3rd arg) when there's an error present => weird
      
    'error has a message': (err, response) ->
      assert.ok err.message?
      # assert.ok response.errcode? -- ONLY PROTOBUF
      
  'a valid map/reduce request':
    topic: ->
      db
        .add(airlines)
        .map(name: 'Riak.mapValuesJson', keep: true)
        .reduce(
          (values) ->
            [values.reduce (acc, value) ->
              acc + (value.fleet or value or 0)
            , 0
            ]
        )
        .run @callback
    
    'returns airlines and total fleet': (response) ->
      # assert.deepEqual [0, 1], response.phases.sort()  -- ONLY PROTOBUF
      [all, totalFleet] = response
      assert.equal 7, all.length
      assert.equal 1029, totalFleet
      
  
  'a keys request':
    topic: ->
      db.keys airports, @callback
    
    'returns the expected keys': (keys) ->
      [ams, other..., muc] = keys.sort()
      assert.equal 8, keys.length
      assert.equal 'AMS', ams
      assert.equal 'MUC', muc
  
}]


teardownBatch =

  'suite teardown':
    topic: ->
      
      done = @callback
      buckets = Object.keys(data)
      
      buckets.forEach (bucket, i) ->
        db.keys bucket, (err, keys) ->
          keys.forEach (key, j) ->
            db.remove bucket, key, ->
              # find a more reliable solution
              if i is buckets.length-1 and j is keys.length-1 then done()
  
    'when complete':
      topic: ->
        db.keys airports, @callback
        
      'data is absent': (keys) ->
        assert.length keys, 0


# add batches to suite in order

batches = batches.concat client.batches(db)
batches.unshift setupBatch
batches.push teardownBatch

for batch in batches
  suite = suite.addBatch(batch)

suite.export module


# Sets up common riak test data for http and pbc clients
data =
  riakjs_airports:
    EZE: [{city: 'Buenos Aires'}]
    BCN: [{city: 'Barcelona'}]
    AMS: [{city: 'Amsterdam'}]
    CDG: [{city: 'Paris'}]
    MUC: [{city: 'Munich'}]
    JFK: [{city: 'New York'}]
    HKK: [{city: 'Hong Kong'}]
    MEX: [{city: 'Mexico DF'}]

  riakjs_airlines:
    AFR: [{name: 'Air France',            fleet: 263, alliance: 'SkyTeam', european: true}]
    AMX: [{name: 'Aeroméxico',            fleet: 43,  alliance: 'SkyTeam', european: false}]
    ARG: [{name: 'Aerolíneas Argentinas', fleet: 40,  european: false}]
    DLH: [{name: 'Lufthansa',             fleet: 262, alliance: 'Star Alliance', european: true}]
    IBE: 
      [
        {name: 'Iberia', fleet: 183, alliance: 'One World', european: true}
        {abc: 1, def: 2}
      ]
    CPA: 
      [
        {name: 'Cathay Pacific', fleet: 127, alliance: 'One World', european: false}
        {
          links: {bucket: "riakjs_flights", key: "CPA-729", tag: "flight"}
        }
      ]
    KLM:
      [
        {name: 'KLM', fleet: 111, alliance: 'SkyTeam', european: true}
        {
          links:
            [
              {bucket: "riakjs_flights", key: 'KLM-8098', tag: 'flight'}
              {bucket: "riakjs_flights", key: 'KLM-1196', tag: 'flight'}
            ]
          abc: 1
        }
      ]

  riakjs_flights:
    'KLM-8098': [{code: 'KLM-8098', to: 'JFK', from: 'AMS', departure: 'Mon, 05 Jul 2010 17:05:00 GMT'}]
    'AFR-394':  [{code: 'AFR-394',  to: 'CDG', from: 'EZE', departure: 'Mon, 12 Jul 2010 05:35:00 GMT'}]
    'CPA-112':  [{code: 'CPA-112',  to: 'HKK', from: 'AMS', departure: 'Wed, 11 Aug 2010 01:20:00 GMT'}]
    'IBE-5624': [{code: 'IBE-5624', to: 'MUC', from: 'BCN', departure: 'Mon, 15 Mar 2010 22:10:00 GMT'}]
    'ARG-714':  [{code: 'ARG-714',  to: 'EZE', from: 'BCN', departure: 'Mon, 08 Mar 2010 20:50:00 GMT'}]
    'DLH-4001': [{code: 'DLH-4001', to: 'JFK', from: 'MUC', departure: 'Tue, 23 Aug 2010 13:30:00 GMT'}]
    'AMX-1344': [{code: 'AMX-1344', to: 'EZE', from: 'MEX', departure: 'Wed, 21 Jul 2010 08:45:00 GMT'}]
    'AMX-1346': [{code: 'AMX-1346', to: 'MEX', from: 'EZE', departure: 'Mon, 08 Mar 2010 19:40:00 GMT'}]
    'KLM-1196': [{code: 'KLM-1196', to: 'AMS', from: 'CDG', departure: 'Fri, 20 Aug 2010 14:59:00 GMT'}]
    'CPA-729':  [{code: 'CPA-729',  to: 'CDG', from: 'HKK', departure: 'Thu, 19 Aug 2010 07:30:00 GMT'}]
    'ARG-909':  [{code: 'ARG-909',  to: 'AMS', from: 'EZE', departure: 'Tue, 24 Aug 2010 15:25:00 GMT'}]
    # EXPENDABLE
    'IBE-4418': [{code: 'IBE-4418', to: 'BCN', from: 'JFK', departure: 'Sat, 24 Jul 2010 12:00:00 GMT'}]
    
[airports, airlines, flights] = Object.keys(data)