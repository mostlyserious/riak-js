seq = require 'seq'
assert = require 'assert'
path = require 'path'
fs = require 'fs'
TestServer = require '../../src/test_server'
{exec} = require 'child_process'

db = require('../../src/index').getClient({port: 9000, debug: false})

seq()

  .seq ->
    exec "locate bin/riaksearch | head -1", @
  
  .seq (data) ->
    binDir = data.substr(0, data.length - 12) or process.env['RIAKJS_BIN_DIR']
    console.log binDir
    if not binDir then throw new Error("Couldn't find Riak bin dir")
    assert.ok(/\/bin$/.test binDir)
    
    # start server
    @vars.server = new TestServer({ binDir: binDir, tempDir: path.normalize("#{process.cwd()}/.testing")})
    @vars.server.prepare(@)
  
  .extend(["bin", "etc", "data", "log", "pipe", "bin/riak", "etc/app.config", "etc/vm.args"])
  
  .seqMap (file) ->
    fs.realpath ".testing/#{file}", @
  
  .seqMap (file) ->
    path.exists file, (exists) =>
      @(null, exists)
    
  .seqEach (result) ->
    assert.ok(result)
    @(null)
  
  .seq ->
    # console.log 'llega'
    @vars.server.start(@)
    @()
    
  .seq ->    
    db.ping(@)
  
  # .seq (result) ->
  #   console.log result
  #   assert.ok(result)
  #   @()
    
  .seq ->
    console.log 'save'
    db.save 'airlines', 'KLM', {fleet: 111, country: 'NL'}, @
  
  .seq ->
    console.log 'get'
    db.get 'airlines', 'KLM', @
  
  .seq (data) ->
    console.log '-----'
    console.dir data
    @vars.server.clear(@)
  
    # bug in node-seq, causing an infinite loop with multiple catch calls
  
  # .seq ->
  #   db.get 'airlines', 'KLM', @
  
  # .catch (err) ->
  #   assert.ok(err)
  #   assert.ok(err.notFound)
  
  .seq ->
    @vars.server.stop(@)
  
  .seq ->
    db.exists 'foo', 'bar', @
  
  .seq ->
    console.log "'s all good"
    
  .catch (err) ->
    assert.ok(err)