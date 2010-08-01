sys      = require 'sys'
net      = require 'net'
fs       = require 'fs'
Buffer   = require('buffer').Buffer

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
      if sch = ProtoBuf.schema["Rpb#name"]
        sch.riak_code  = ProtoBuf.types.indexOf(name)
        @[cached_name] = sch
      else
        @[cached_name] = {}