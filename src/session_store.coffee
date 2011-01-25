Store = require('connect/middleware/session/store')

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

exports = SessionStore
