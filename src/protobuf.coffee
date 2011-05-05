sys      = require 'sys'
net      = require 'net'
fs       = require 'fs'
events   = require 'events'
path     = require 'path'
Buffer   = require('buffer').Buffer

# Keeps a pool of Riak socket connections.
class Pool
  constructor: (options) ->
    @options = options or {}
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
        callback(conn) if callback
      else
        conn.on 'connect', ->
          callback(conn) if callback

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
  send: (name, data, callback) ->
    @start (conn) ->
      conn.send name, data, (resp) ->
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
  PB_HEADER_LENGTH = 5
  
  constructor: (pool) ->
    @conn = net.createConnection pool.options.port, pool.options.host
    @pool = pool
    @conn.on 'data', (chunk) => @receive chunk
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
  send: (name, data, callback) ->
      @callback = callback
      @conn.write @prepare(name, data)

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
    
    type = Protobuf[name]
    
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

  chunk_append: (buf) ->
    @new_buf = new Buffer(@chunk.length + buf.length) 
    @chunk.copy(@new_buf, 0, 0)
    buf.copy(@new_buf, @chunk.length, 0)
    @chunk = @new_buf

  # Parses the received chunk for one or more messages.  If there is no data
  # from a Riak response left to read from the chunk, release this connection
  # to the pool.
  #
  # Returns nothing.
  receive: (chunk) ->
    # Append the chunk to the current buffer
    @chunk_append(chunk)

    if @attempt_parse()
      if @pool.running? then @reset() else @end()

  # Attempts to parse the received data from Riak.  If a response is returned
  # from parse(), pass it to the callback and then check if there is more 
  # data in the current chunk.
  #
  # Returns true if the chunk has been parsed and no data is expected, or 
  # null if there is more data to be read.
  attempt_parse: ->
    if data = @parse()
      if data.errmsg? and data.errcode?
        code = data.errcode
        data = new Error data.errmsg
        data.errcode = code
      @callback data if @callback

      # if there's more to be read, keep reading
      if @chunk_pos < @chunk.length
        @resp = null
        @attempt_parse()
      else
        true

  # Parses the received data from Riak.
  #
  # Returns the deserialized Object if the full response has been read, or 
  # null.
  parse: ->
    # is a response buffer created?  if so, read for data
    if @receiving
      ending      = @resp_len + @chunk_pos
      ending      = @chunk.length if ending > @chunk.length
      bytes_read  = ending - @chunk_pos
      @chunk.copy @resp, @resp_pos, @chunk_pos, ending
      @resp_pos  += bytes_read
      @chunk_pos += bytes_read

      # are we there yet?
      if @resp_pos >= @resp_len
        resp = @type.parse @resp 
        
        # slice the chunk to leave any remaining bytes
        remaining = @chunk.slice(@resp_len + PB_HEADER_LENGTH, @chunk.length)
        
        # reset because a full response has been read
        @reset()
  
        # set the current chunk to the remaining part
        @chunk = remaining
        
        resp
    else
      if @chunk.length < PB_HEADER_LENGTH
        return
    
      @resp_len = (@chunk[@chunk_pos + 0] << 24) + 
                  (@chunk[@chunk_pos + 1] << 16) +
                  (@chunk[@chunk_pos + 2] <<  8) +
                   @chunk[@chunk_pos + 3]  -  1
      @type       = Protobuf.type @chunk[@chunk_pos + 4]
      @resp       = new Buffer(@resp_len)
      @resp_pos   = 0
      @chunk_pos += 5
      @parse()

  # Resets the state of this Connection for the next request.
  #
  # Returns nothing.
  reset: ->
    @type      = null
    @resp      = null
    @chunk     = new Buffer(0)
    @chunk_pos = 0 # byte position of the chunk buffer
    @resp_pos  = 0 # byte position of the response buffer
    @resp_len  = 0 # expected response length

Connection.prototype.__defineGetter__ 'receiving', ->
  @resp

Connection.prototype.__defineGetter__ 'writable',  ->
  @conn.writable

Pool.Connection = Connection

Protobuf = 
  types: [
    "ErrorResp" # 0
    "PingReq" # 1
    "PingResp" # 2
    "GetClientIdReq" # 3
    "GetClientIdResp" # 4
    "SetClientIdReq" # 5
    "SetClientIdResp" # 6
    "GetServerInfoReq" # 7
    "GetServerInfoResp" # 8
    "GetReq" # 9
    "GetResp" # 10
    "PutReq" # 11
    "PutResp" # 12
    "DelReq" # 13
    "DelResp" # 14
    "ListBucketsReq" # 15
    "ListBucketsResp" # 16
    "ListKeysReq" # 17
    "ListKeysResp" # 18
    "GetBucketReq" # 19
    "GetBucketResp" # 20
    "SetBucketReq" # 21
    "SetBucketResp" # 22
    "MapRedReq" # 23
    "MapRedResp" # 24
  ]

  # Find a Protobuf type given its riak code.
  type: (num) ->
    @[@types[num]]

  schemaFile: path.join path.dirname(module.filename), 'riak.desc'

# lazily load protobuf schema
Protobuf.__defineGetter__ 'schema', ->
  @_schema ||= new (require('protobuf_for_node').Schema)(fs.readFileSync(Protobuf.schemaFile))

# lazily load protobuf types
Protobuf.types.forEach (name) ->
  cached_name = "_#{name}"

  Protobuf.__defineGetter__ name, ->
    if @[cached_name]
      @[cached_name]
    else
      code = Protobuf.types.indexOf(name)
      if sch = Protobuf.schema["Rpb#{name}"]
        sch.riak_code  = code
        @[cached_name] = sch
      else
        @[cached_name] = 
          riak_code: code
          parse: -> true

module.exports = Pool