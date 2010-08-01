sys      = require 'sys'
net      = require 'net'
fs       = require 'fs'
events   = require 'events'
Buffer   = require('buffer').Buffer
Riak     = {}

# Keeps a pool of Riak socket connections.
class Riak.Pool
  constructor: (options) ->
    @options = options ||  {}
    @options.port      ||= 8087
    @options.host      ||= '127.0.0.1'
    @options.max       ||= 10
    @running             = 0
    @pool                = []
    @active              = {}
    @events              = new events.EventEmitter()

  # Public: Returns a Riak.Connection instance from the pool.
  #
  # callback - Optional Function callback is called with the Riak.Connection
  #            instance when it is ready to send connections.
  #
  # Returns a true if the Pool is active, or false if it isn't.
  start: (callback) ->
    return false if !@running?

    @next (conn) =>
      if conn.writable
        @active[conn.client_id] = conn
        callback conn if callback
      else
        conn.on 'connect', =>
          conn.send('GetClientIdReq') (data) =>
            conn.clientId          = data.clientId
            @active[conn.clientId] = data.clientId
            callback conn if callback

    true

  # Public: Returns the Riak.Connection back to the Pool.  If the Pool is
  # inactive, disconnect the Riak.Connection.
  #
  # conn - Riak.Connection instance.
  #
  # Returns nothing.
  finish: (conn) ->
    if @running?
      @running -= 1
      @events.emit 'finish'
      pos  = @active[conn.client_id]
      delete @active[pos]
      @pool.push conn if @pool.length < @options.max
    else
      conn.end()

  # Public: Disconnects all Riak.Connection instances in the Pool.
  #
  # Returns nothing.
  end: ->
    @running = null
    @pool.forEach (conn) ->
      conn.end()

  # Fetches a Riak.Connection from the pool and calls the given callback with
  # it.
  #
  # callback - Function that is called with a Riak.Connection.
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

  # Pops a fresh Riak.Connection from the pool.
  #
  # Returns a Riak.Connection instance.
  getConnection: ->
    @running += 1
    @pool.pop() || new Riak.Connection(this)

# A single Riak socket connection.
class Riak.Connection
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

  # Public: Releases this Riak.Connection back to the pool.
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
  # Returns this Riak.Connection instance.
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

  # Resets the state of this Riak.Connection for the next request.
  #
  # Returns nothing.
  reset: ->
    @type   = null
    @resp   = null
    @read   = 0
    @length = 0

Riak.Connection.prototype.__defineGetter__ 'receiving', ->
  @resp

Riak.Connection.prototype.__defineGetter__ 'writable',  ->
  @conn.writable

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

# lazily load protobuf schema
ProtoBuf.__defineGetter__ 'schema', ->
  @_schema ||= new (require('protobuf_for_node').Schema)(fs.readFileSync('./riak.desc'))

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

module.exports = Riak.Pool