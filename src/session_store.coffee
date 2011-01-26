{Store} = require('connect/middleware/session')

class SessionStore extends Store
  constructor: (options) ->
    super options
    @client = options.client
    @bucket = options.bucket || '_sessions'

  set: (sid, sess, cb) ->
    @client.save @bucket, sid, sess, cb

  get: (sid, cb) ->
    @client.get @bucket, sid, (err, data, meta) ->
      if err?
        cb(err, null) if cb
      else
        cb(null, data) if cb

  destroy: (sid, cb) ->
    @client.remove @bucket, sid, cb

  all: (cb) ->
    @client.getAll @bucket, (err, sessions) ->
      if err
        cb(err, null) if cb
      else
        cb(null, sessions.map((i) -> i.data)) if cb

  clear: (cb) ->
    @client.keys @bucket, (err, meta, keys) ->
      deleteNextKey = (err, meta) =>
        if keys.length > 0
          @client.remove @bucket, keys.shift, deleteNextKey
        else
          cb() if cb

      @client.remove @bucket, keys.shift, deleteNextKey

  length: (cb) ->
    @client.count @bucket, cb


exports = SessionStore
