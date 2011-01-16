vows = require 'vows'
assert = require 'assert'
pb = require '../src/protobuf';
sys = require 'sys'

suite = vows.describe "Riak protobuf parsing"

suite.addBatch({
  'a connection':
    topic: ->
      pool = new pb
      pool.getConnection()
      
    'parses a full response': (conn) ->
      pong = false
      conn.callback = (p) ->
        pong = true
      
      conn.receive(new Buffer('\x00\x00\x00\x01\x02'))
      assert.ok pong
    
    'parses partial responses': (conn) ->
      pong = false
      conn.callback = (p) ->
        pong = true
      
      conn.receive(new Buffer('\x00\x00\x00\x01'))
      conn.receive(new Buffer('\x02'))
      assert.ok pong

    'parses partial header and response': (conn) ->
       pong = false
       conn.callback = (p) ->
         pong = true
        
       conn.receive(new Buffer('\x00\x00'))
       conn.receive(new Buffer('\x00\x01'))
       conn.receive(new Buffer('\x02'))
       assert.ok pong
    
    'parses partial header and partial response': (conn) ->
       pong = false
       conn.callback = (p) ->
         pong = true
        
       conn.receive(new Buffer('\x00\x00'))
       conn.receive(new Buffer('\x00\x07'))
       conn.receive(new Buffer('\x04'))
       conn.receive(new Buffer('\x0a\x04'))
       conn.receive(new Buffer('\x01\x65'))
       conn.receive(new Buffer('\x01\x39'))

       assert.ok pong 
       
    'parses multiple responses, with the second response partial': (conn) ->
       pongs = 0
       conn.callback = (p) ->
         pongs++
        
       conn.receive(new Buffer('\x00\x00\x00\x01\x02\x00\x00\x00\x01'))
       conn.receive(new Buffer('\x02'))

       assert.equal pongs, 2
       
    'parses multiple responses, with the partial headers and messages': (conn) ->
       pongs = 0
       conn.callback = (p) ->
         pongs++
        
       conn.receive(new Buffer('\x00\x00\x00\x01\x02\x00\x00'))
       conn.receive(new Buffer('\x00'))
       conn.receive(new Buffer('\x07'))
       conn.receive(new Buffer('\x04'))
       conn.receive(new Buffer('\x0a\x04'))
       conn.receive(new Buffer('\x01\x65'))
       conn.receive(new Buffer('\x01\x39\x00\x00\x00\x01\x02'))

       assert.equal pongs, 3
      
}).export(module)