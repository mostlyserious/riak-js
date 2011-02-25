{exec, spawn} = require 'child_process'

handleError = (err) ->
  if err
    console.log "\n\033[1;36m=>\033[1;37m Remember that you need: coffee-script@0.9.4 and vows@0.5.2\033[0;37m\n"
    console.log err.stack

print = (data) -> console.log data.toString().trim()

##

option '-s', '--spec', 'Use Vows spec mode'

task 'build', 'Compile riak-js Coffeescript source to Javascript', ->
  exec 'mkdir -p lib && ln -sf ../src/riak.desc lib && coffee -c -o lib src', handleError

task 'clean', 'Remove generated Javascripts', ->
  exec 'rm -fr lib', handleError

task 'test', 'Test the app', (options) ->
  # invoke 'build'

  args = [
    'spec/test_client.coffee'
    'spec/test_http_meta.coffee'
    'spec/test_mapper.coffee'
    'spec/test_meta.coffee'
    # 'spec/test_test_server.coffee'
    # 'spec/test_session_store.coffee'
  ]
  args.unshift '--spec' if options.spec

  vows = spawn 'vows', args
  vows.stdout.on 'data', print
  vows.stderr.on 'data', print

task 'dev', 'Continuous compilation', ->
  coffee = spawn 'coffee', '-wc --bare -o lib src'.split(' ')

  coffee.stdout.on 'data', print
  coffee.stderr.on 'data', print
