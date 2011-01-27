vows = require 'vows'
assert = require 'assert'
binDir = process.env['RIAKJS_BIN_DIR']
path = require 'path'
sys = require 'sys'
fs = require 'fs'

if binDir
  db = require('../src/index').getClient({port: 9000, debug: false})
  TestServer = require('../src/test_server')
  ts = new TestServer({binDir: binDir, tempDir: path.normalize("#{process.cwd()}/.testing")})

  suite = vows.describe "Riak Test Server"

  createsFile = () ->
    {
      topic: ->
        fs.realpath @context.name.trim(), (err, fullpath) =>
          path.exists fullpath, @callback
        undefined
      "is created": (exists) -> assert.isTrue exists
    }

  createsFiles = (fileList) ->
    context =
      topic: ->
        ts.prepare @callback
        undefined
    context[file] = createsFile() for file in fileList
    context

  files =
    [
      ".testing"
      ".testing/bin"
      ".testing/etc"
      ".testing/data"
      ".testing/log"
      ".testing/pipe"
      ".testing/bin/riak"
      ".testing/etc/app.config"
      ".testing/etc/vm.args"
    ]

  suite.addBatch {
    "preparing": createsFiles(files)
  }

  suite.addBatch {
    "starting":
      topic: ->
        ts.start =>
          db.ping @callback
        undefined
      "makes Riak available on the test port": (err, data, meta)->
        assert.isTrue(data)
  }

  suite.addBatch {
    "clearing":
      topic: ->
        ts.start =>
          db.save 'airlines', 'KLM',{fleet: 111, country: 'NL'}, {}, (err) =>
            throw err if err?
            ts.clear =>
              db.get 'airlines', 'KLM', @callback
        undefined
      "wipes saved data": (err, data, meta) ->
        assert.isNotNull err
        assert.include err, "notFound"
  }

  suite.addBatch {
    "stopping":
      topic: ->
        ts.stop =>
          db.exists "riak-js", "not-here", @callback
        undefined
      "makes Riak unavailable": (err, data, meta) ->
        assert.instanceOf err, Error
  }
  suite.export module
else
  sys.puts "Can't run the TestServer specs, specify the location of your `riak` script in the RIAKJS_BIN_DIR environment variable."
