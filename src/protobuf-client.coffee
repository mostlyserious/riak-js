Client = require './client'
Pool   = require './protobuf'
sys = require 'sys'
class ProtoBufClient extends Client
  ping: ->
    (callback) =>
      @pool.send('PingReq') (data) ->
        callback data

  end: ->
    @pool.end()

ProtoBufClient.prototype.__defineGetter__ 'pool', ->
  @_pool ||= new Pool(@options)

module.exports = ProtoBufClient