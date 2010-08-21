# Sets up common riak test data for http and pbc clients
global.RIAKJS_CLIENT_TEST_DATA =
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
    IBE: [{name: 'Iberia',                fleet: 183, alliance: 'One World', european: true}]
    CPA: [{name: 'Cathay Pacific',        fleet: 127, alliance: 'One World', european: false}]
    KLM:
      [
        {name: 'KLM', fleet: 111, alliance: 'SkyTeam', european: true}
        {links:
          [
            {bucket: "riakjs_client_test_flights", key: 'KLM-8098', tag: 'flight'}
            {bucket: "riakjs_client_test_flights", key: 'KLM-1196', tag: 'flight'}
          ]
        }
      ]

  riakjs_flights:
    KLM_8098: [{code: 'KLM-8098', to: 'JFK', from: 'AMS', departure: 'Mon, 05 Jul 2010 17:05:00 GMT'}]
    AFR_394:  [{code: 'AFR-394',  to: 'CDG', from: 'EZE', departure: 'Mon, 12 Jul 2010 05:35:00 GMT'}]
    CPA_112:  [{code: 'CPA-112',  to: 'HKK', from: 'AMS', departure: 'Wed, 11 Aug 2010 01:20:00 GMT'}]
    IBE_5624: [{code: 'IBE-5624', to: 'MUC', from: 'BCN', departure: 'Mon, 15 Mar 2010 22:10:00 GMT'}]
    ARG_714:  [{code: 'ARG-714',  to: 'EZE', from: 'BCN', departure: 'Mon, 08 Mar 2010 20:50:00 GMT'}]
    DLH_4001: [{code: 'DLH-4001', to: 'JFK', from: 'MUC', departure: 'Tue, 23 Aug 2010 13:30:00 GMT'}]
    AMX_1344: [{code: 'AMX-1344', to: 'EZE', from: 'MEX', departure: 'Wed, 21 Jul 2010 08:45:00 GMT'}]
    AMX_1346: [{code: 'AMX-1346', to: 'MEX', from: 'EZE', departure: 'Mon, 08 Mar 2010 19:40:00 GMT'}]
    KLM_1196: [{code: 'KLM-1196', to: 'AMS', from: 'CDG', departure: 'Fri, 20 Aug 2010 14:59:00 GMT'}]
    CPA_729:  [{code: 'CPA-729',  to: 'CDG', from: 'HKK', departure: 'Thu, 19 Aug 2010 07:30:00 GMT'}]
    ARG_909:  [{code: 'ARG-909',  to: 'AMS', from: 'EZE', departure: 'Tue, 24 Aug 2010 15:25:00 GMT'}]
    # EXPENDABLE
    IBE_4418: [{code: 'IBE-4418', to: 'BCN', from: 'JFK', departure: 'Sat, 24 Jul 2010 12:00:00 GMT'}]

module.exports = (test) ->
  calls = 0
  process.on 'exit', ->
    assert.equal 7, calls, "#{calls} out of 7 core Riak tests for #{test.api}"

  LOAD test.api, RIAKJS_CLIENT_TEST_DATA, ->
    test (db, end) ->
      db.ping() (data) ->
        calls += 1
        assert.equal true, data
        end()

    test (db, end) ->
      db.buckets() (buckets) ->
        calls += 1
        assert.deepEqual [
            'riakjs_airlines'
            'riakjs_airports'
            'riakjs_flights'
          ], buckets.sort()
        end()

    test (db, end) ->
      db.get('riakjs_airlines', 'KLM') (air, meta) ->
        calls += 1
        assert.equal 'riakjs_airlines',  meta.bucket
        assert.equal 'KLM',              meta.key
        assert.equal 'application/json', meta.contentType
        assert.equal 111,                air.fleet
        assert.ok meta.vclock?
        end()

    test (db, end) ->
      db.get('riakjs_flights', 'IBE_4418') (flight) ->
        assert.equal 'JFK', flight.from

        db.remove('riakjs_flights', 'IBE_4418') (data) ->
          assert.ok data

          db.get('riakjs_flights', 'IBE_4418') (flight) ->
            assert.equal undefined, flight
            calls += 1
            end()

    test (db, end) ->
      db.
        map(
          (value) ->
            this.should.raise.something
        ).
        run('riakjs_airlines') (response) ->
          calls += 1
          assert.ok response.message?
          assert.ok response.errcode?
          end()

    test (db, end) ->
      db.
        map(name: 'Riak.mapValuesJson', keep: true).
        reduce(
          (values) ->
            values.reduce (acc, value) ->
              acc + value.fleet
            , 0
        ).
        run('riakjs_airlines') (response) ->
          calls += 1
          assert.deepEqual [0, 1], response.phases.sort()
          assert.equal      7,     response[0].length
          assert.equal      1029,  response[1]
          end()

    test (db, end) ->
      db.keys('riakjs_airports') (keys) ->
        calls += 1
        assert.equal 8,     keys.length
        assert.equal 'AMS', keys.sort()[0]
        end()