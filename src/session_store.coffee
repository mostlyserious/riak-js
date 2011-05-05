{Store} = require('connect').session

Store.prototype.constructor = Store

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
        
        if meta.statusCode >= 400 && meta.statusCode < 500
          err.errno = process.ENOENT
        
        cb() if cb
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

  length: (cb) ->
    @client.count @bucket, cb


module.exports = SessionStore
