sys = require 'sys'
{spawn} = require 'child_process'
fs = require 'fs'
path = require 'path'
EventEmitter = require('events').EventEmitter

Utils = require './utils'

erlangPath = path.normalize("#{__dirname}/../erl_src")
tempPath = path.normalize("#{process.cwd()}/.riaktest")

# Ported from the Ruby riak-client
class TestServer extends EventEmitter
  @defaults =
    appConfig:
      riak_core:
        web_ip: "127.0.0.1"
        web_port: 9000
        handoff_port: 9001
        ring_creation_size: 64
      riak_kv:
        storage_backend: {atom: "riak_kv_test_backend"}
        pb_ip: "127.0.0.1"
        pb_port: 9002
        js_vm_count: 8
        js_max_vm_mem: 8
        js_thread_stack: 16
        riak_kv_stat: true
      luwak:
        enabled: false
      sasl:
        errlog_type: {atom: "error"}
    vmArgs:
      "-name": "riaktest#{Math.floor(Math.random()*100000000000)}@127.0.0.1"
      "-setcookie": "riak-js-test"
      "+K": true
      "+A": 64
      "-smp": "enable"
      "-env ERL_MAX_PORTS": 4096
      "-env ERL_FULLSWEEP_AFTER": 0
      "-pa": erlangPath
    tempDir: tempPath

  constructor: (options) ->
    @options = Utils.mixin true, {}, TestServer.defaults, options
    @options.appConfig.riak_core.ring_state_dir = "#{@options.tempDir}/data/ring"
    @options.binDir = path.normalize(@options.binDir)
    @erlangPrompt = new RegExp("^.#{@options.vmArgs['-name']}.\\d+>", "m")

  prepare: (callback) ->
    if @prepared
      callback() if callback
    else
      @createTempDirectories =>
        @riakScript = "#{@temp_bin}/riak"
        @writeRiakScript  =>
          @writeVmArgs =>
            @writeAppConfig =>
              @prepared = true
              callback() if callback

  start: (callback) ->
    if @started
      callback() if callback
    else if @prepared and @listeners('erlangPrompt').length is 0
      setStarted = =>
        @started = true
        callback() if callback

      @once 'erlangPrompt', setStarted
      @console = spawn(@riakScript, ["console"])

      @console.stdout.setEncoding("ascii")
      @console.stderr.setEncoding("ascii")

      # do the work of what we get from expect() in Ruby
      @console.stdout.on 'data', (data) =>
        unless data.search(@erlangPrompt) is -1
          @emit('erlangPrompt')

      if @options.debug
        @console.stderr.on 'data', sys.debug
        @console.stdout.on 'data', sys.debug

      process.on 'exit', =>
        @console.kill('SIGKILL') if @console
        @registerStop()

  stop: (callback) ->
    if not @started and callback
      callback()
    if @started and @listeners('erlangPrompt').length is 0
      @console.on 'exit', callback if callback
      @console.kill('SIGHUP')
      @registerStop()

  clear: (callback) ->
    if @started and @listeners('erlangPrompt').length is 0
      setStarted = =>
        @started = true
        callback() if callback
      sendReset = =>
        @once 'erlangPrompt', setStarted
        @started = false
        @console.stdin.write("riak_kv_test_backend:reset().\n", "ascii")
      @once 'erlangPrompt', sendReset
      @console.stdin.write("ok.\n", "ascii")

  registerStop: ->
    @removeAllListeners('erlangPrompt')
    delete @console
    @started = false

  createTempDirectories: (callback) ->
    subdirs = for dir in ['bin', 'etc', 'log', 'data', 'pipe']
      this["temp_#{dir}"] = path.normalize("#{@options.tempDir}/#{dir}")
    subdirs.unshift @options.tempDir
    createDir = =>
      if subdirs.length is 0
        callback()
      else
        currDir = subdirs.shift()
        fs.mkdir currDir, 0700, createDir
    rmrf = spawn("rm", ["-rf", @options.tempDir])
    rmrf.on 'exit', createDir

  writeRiakScript: (callback) ->
    outScript = fs.createWriteStream @riakScript, {encoding: 'utf8', mode: 0700}
    inScript = fs.createReadStream "#{@options.binDir}/riak", encoding: 'utf8'

    inScript.on 'error', (err) ->
      sys.debug "error reading from #{inScript.path}:\n#{sys.inspect(err, true, null)}"
      throw err
    outScript.on 'error', (err) ->
      sys.debug "error writing to #{outScript.path} script:\n#{sys.inspect(err, true, null)}"
      throw err

    outScript.on 'drain', -> inScript.resume()

    inScript.on 'data', (data) =>
      data = data.toString('utf8') if Buffer.isBuffer(data)
      data = data.replace(/(RUNNER_SCRIPT_DIR=)(.*)$/m, "$1#{@temp_bin}")
      data = data.replace(/(RUNNER_ETC_DIR=)(.*)$/m, "$1#{@temp_etc}")
      data = data.replace(/(RUNNER_USER=)(.*)$/m, "$1")
      data = data.replace(/(RUNNER_LOG_DIR=)(.*)$/m, "$1#{@temp_log}")
      data = data.replace(/(PIPE_DIR=)(.*)$/m, "$1#{@temp_pipe}")
      data = data.replace("RUNNER_BASE_DIR=${RUNNER_SCRIPT_DIR%/*}", "RUNNER_BASE_DIR=#{path.normalize(@options.binDir + '/..')}")
      outScript.write data
      inScript.pause()

    inScript.on 'end', ->
      outScript.end()
      callback() if callback

  writeVmArgs: (callback) ->
    vmArgs = for own option, value of @options.vmArgs
      "#{option} #{value}"

    vmArgs = vmArgs.join("\n")
    fs.writeFile("#{@temp_etc}/vm.args", vmArgs, callback)

  writeAppConfig: (callback) ->
    appConfig = @toErlangConfig(@options.appConfig) + "."
    fs.writeFile("#{@temp_etc}/app.config", appConfig, callback)

  # Converts an object into app.config-compatible Erlang terms
  toErlangConfig: (object, depth = 1) ->
    padding = ('    ' for num in [1..depth]).join ""

    parentPadding = if depth <= 1
        ''
      else
        ('    ' for num in [1..(depth-1)]).join ""

    values = for own key, value of object
      if value.atom?
        printable = value.atom
      else if typeof value is 'string'
        printable = "\"#{value}\""
      else if value instanceof Object
        printable = @toErlangConfig(value, depth+1)
      else
        printable = value.toString()
      "{#{key}, #{printable}}"

    values = values.join(",\n#{padding}")

    "[\n#{padding}#{values}\n#{parentPadding}]"

  # Node v0.2.6 doesn't have EventEmitter.once
  once: (type, listener) ->
    callback = =>
      @removeListener(type, callback)
      listener.apply(this, arguments)
    @on type, callback
    this

module.exports = TestServer
