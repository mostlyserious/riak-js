sys      = require 'sys'
net      = require 'net'
fs       = require 'fs'
events   = require 'events'
path     = require 'path'
Buffer   = require('buffer').Buffer

# Keeps a pool of Riak socket connections.
class Pool
  constructor: (options) ->
    @options = options ||  {}
    @options.port      ||= 8087
    @options.host      ||= '127.0.0.1'
    @options.max       ||= 10
    @running             = 0
    @pool                = []
    @events              = new events.EventEmitter()

  # Public: Returns a Connection instance from the pool.  Socket 
  # connections should be used for synchronous options.  If you want to run
  # things in parallel, use Pool#send instead.
  #
  # callback - Optional Function callback is called with the Connection
  #            instance when it is ready to send connections.
  #
  # Returns a true if the Pool is active, or false if it isn't.
  start: (callback) ->
    return false if !@running?

    @next (conn) ->
      if conn.writable
        callback conn if callback
      else
        conn.on 'connect', ->
          callback conn if callback

    true

  # Public: Shortcut for getting a connection from the pool, sending a message,
  # and releasing it back to the pool.  These two operations are the same:
  #
  #   pool.start (conn) ->
  #     conn.send('PingReq') (data) ->
  #       sys.puts data
  #       conn.finish()
  #
  #   pool.send('PingReq') (data) ->
  #     sys.puts data
  #
  # name - String Riak message type, without the Rpb prefix. (ex: 'PingReq')
  # data - Object data to be serialized.
  #
  # Returns anonymous function that takes a single callback.
  send: (name, data) ->
    (callback) =>
      @start (conn) ->
        conn.send(name, data) (resp) ->
          try
            callback resp
          finally
            conn.finish()

  # Public: Returns the Connection back to the Pool.  If the Pool is
  # inactive, disconnect the Connection.
  #
  # conn - Connection instance.
  #
  # Returns nothing.
  finish: (conn) ->
    if @running?
      @running -= 1
      @events.emit 'finish'
      @pool.push conn if @pool.length < @options.max
    else
      conn.end()

  # Public: Disconnects all Connection instances in the Pool.
  #
  # Returns nothing.
  end: ->
    @running = null
    @pool.forEach (conn) ->
      conn.end()

  # Fetches a Connection from the pool and calls the given callback with
  # it.
  #
  # callback - Function that is called with a Connection.
  #
  # Returns nothing.
  next: (callback) ->
    if @running >= @options.max
      @events.on 'finish', (cb = =>
        if @running < @options.max
          callback @getConnection()
          @events.removeListener 'finish', cb
      )
    else
      callback @getConnection()

  # Pops a fresh Connection from the pool.
  #
  # Returns a Connection instance.
  getConnection: ->
    @running += 1
    @pool.pop() || new Connection(this)

# A single Riak socket connection.
class Connection
  constructor: (pool) ->
    @conn = net.createConnection pool.options.port, pool.options.host
    @pool = pool

    @conn.on 'data', (chunk) =>
      if data = @receive chunk
        @callback data if @callback
        if pool.running? then @reset() else @end()

    @reset()

  # Sends a given message to Riak.
  #
  #   conn.send("SetClientIdReq", clientId: 'abc') (data) ->
  #     sys.puts sys.inspect(data)
  #
  # name - String Riak message type, without the Rpb prefix. (ex: 'PingReq')
  # data - Object data to be serialized.
  #
  # Returns anonymous function that takes a single callback.
  send: (name, data) ->
    payload = @prepare name, data
    (callback) =>
      @callback = callback
      @conn.write payload

  # Public: Releases this Connection back to the pool.
  #
  # Returns nothing.
  finish: ->
    @pool.finish this

  # Public: Disconnects from Riak.
  #
  # Returns nothing.
  end: ->
    @conn.end()

  # Public: Attaches an event listener to the socket connection.
  #
  # event    - String event name.
  # listener - Function that is called when the event is emitted.
  #
  # Returns this Connection instance.
  on: (event, listener) ->
    @conn.on event, listener
    this

  # Converts the outgoing data into an appropriate Riak message.
  #
  # name - String Riak message type, without the Rpb prefix. (ex: 'PingReq')
  # data - Object data to be serialized.
  #
  # Returns a Buffer that is ready to be sent to Riak.
  prepare: (name, data) ->
    type = ProtoBuf[name]
    if data
      buf = type.serialize(data)
      len = buf.length + 1
    else
      len = 1
    msg    = new Buffer(len + 4)
    msg[0] = len >>>  24
    msg[1] = len >>>  16
    msg[2] = len >>>   8
    msg[3] = len &   255
    msg[4] = type.riak_code
    if buf
      buf.copy msg, 5, 0
    msg

  # Parses the received data from Riak.
  #
  # chunk    - A Buffer sent from Riak.
  # starting - The starting point in the buffer to read from.
  #
  # Returns the deserialized Object if the full response has been read, or 
  # null.
  receive: (chunk, starting) ->
    # is a response buffer created?  if so, read for data
    if @receiving
      chunk_len  = chunk.length
      starting ||= 0 # starting point on the chunk to read
      chunk.copy @resp, @read, starting, chunk_len
      @read     += chunk_len - starting

      # are we there yet?
      @type.parse @resp if @read == @length

    else
      @length = (chunk[0] << 24) + 
                (chunk[1] << 16) +
                (chunk[2] <<  8) +
                 chunk[3]  -  1
      @type = ProtoBuf.type chunk[4]
      @resp = new Buffer(@length)
      @receive chunk, 5

  # Resets the state of this Connection for the next request.
  #
  # Returns nothing.
  reset: ->
    @type   = null
    @resp   = null
    @read   = 0
    @length = 0

Connection.prototype.__defineGetter__ 'receiving', ->
  @resp

Connection.prototype.__defineGetter__ 'writable',  ->
  @conn.writable

Pool.Connection = Connection

ProtoBuf = 
  types: ["ErrorResp", "PingReq", "PingResp", "GetClientIdReq", 
  "GetClientIdResp", "SetClientIdReq", "SetClientIdResp", "GetServerInfoReq", 
  "GetServerInfoResp", "GetReq", "GetResp", "PutReq", "PutResp", "DelReq", 
  "DelResp", "ListBucketsReq", "ListBucketsResp", "ListKeysReq", 
  "ListKeysResp", "GetBucketReq", "GetBucketResp", "SetBucketReq", 
  "SetBucketResp", "MapRedReq", "MapRedResp"]

  # Find a ProtoBuf type given its riak code.
  type: (num) ->
    @[@types[num]]

  schemaFile: path.join path.dirname(module.filename), 'riak.desc'

# lazily load protobuf schema
ProtoBuf.__defineGetter__ 'schema', ->
  @_schema ||= new (require('protobuf_for_node').Schema)(
    fs.readFileSync(ProtoBuf.schemaFile))

# lazily load protobuf types
ProtoBuf.types.forEach (name) ->
  cached_name = "_#name"

  ProtoBuf.__defineGetter__ name, ->
    if @[cached_name]
      @[cached_name]
    else
      code = ProtoBuf.types.indexOf(name)
      if sch = ProtoBuf.schema["Rpb#name"]
        sch.riak_code  = code
        @[cached_name] = sch
      else
        @[cached_name] = 
          riak_code: code
          parse: -> true

module.exports = Pool