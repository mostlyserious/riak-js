TestServer = require('./index').TestServer
path = require 'path'

ts = new TestServer({debug: true, binDir: "/opt/riak/bin", tempDir: path.normalize(process.cwd() + "/.testing")})

ts.prepare ->
  console.log 'prepared'
  
  ts.start ->
    console.log 'started'