vows = require 'vows'
assert = require 'assert'
riak = require('../src/index')
db = riak.getClient({ api: 'http', port: 9000, debug: false })
store = riak.getSessionStore({client: db})
testServer = new riak.TestServer(binDir: process.env['RIAKJS_BIN_DIR'])
sys = require 'sys'

suite = vows.describe "Riak Connect Session Store"

suite.addBatch
  'setup':
    topic: ->
      testServer.prepare =>
        testServer.start @callback
      undefined
    'works': ->
      assert.isTrue testServer.started

suite.addBatch
  'storing a session':
    topic: ->
      testServer.clear =>
        store.set 'frank', {user:"frank06"}, @callback
      undefined
    'succeeds': (err, data, meta) ->
      assert.ok !err
    'then retrieving the stored session':
      topic: ->
        store.get 'frank', @callback
        undefined
      'succeeds': (err, data) ->
        assert.ok !err
        assert.deepEqual data, {user:"frank06"}
    'then destroying the session':
      topic: ->
        store.destroy 'frank', @callback
        undefined
      'succeeds': (err) ->
        assert.ok !err
      'makes the session unavailable':
        topic: ->
          store.get 'frank', @callback
          undefined
        'successfully': (err, data) ->
          assert.isNotNull err
          assert.equal err.errno, process.ENOENT
          assert.isUndefined data

suite.addBatch
  'retrieving all sessions':
    topic: ->
      testServer.clear =>
        store.set 'frank', {user:'frank06'}, =>
          store.set 'rick', {user:'technoweenie'}, =>
            store.all @callback
      undefined
    'finds all sessions': (sessions) ->
      assert.equal sessions.length, 2

suite.addBatch
  'counting existing sessions':
    topic: ->
      testServer.clear =>
        store.set 'frank', {user:'frank06'}, =>
          store.set 'rick', {user:'technoweenie'}, =>
            store.length @callback
      undefined
    'returns a count': (count) ->
      assert.equal count, 2

suite.addBatch
  'teardown':
    topic: ->
      testServer.stop @callback
      undefined
    'works': ->
      assert.ok !testServer.started

suite.export module
