## riak-js

### A Javascript library for Riak

#### Features so far

 - Sensible yet overridable defaults (init, per-request)
 - Operations: get bucket, get doc, save, remove, walk, map/reduce
 - Available for node.js (v0.1.30+) and browser/jQuery platforms and Riak 0.8+

#### Defaults

All operations take an `options` object as the last argument. These specified options will override the defaults, which are defined as:

    {
      method: 'GET',
      interface: 'riak',
      headers: {},
      callback: function(response, meta) { Riak.prototype.log(response) },
      errback: function(response, meta) { Riak.prototype.log(meta.statusCode + ": " + response, 'error') },
      returnbody: false,
      debug: true
    }

as well as `localhost` for the host and `8098` for the port.

#### Set up

##### node.js

    require.paths.unshift(".");
    var Riak = require('riak-node'), db = new Riak.Client();

##### browser with jQuery

    var db = new Riak();

#### An example session

##### Get and save a document

     db.get('albums', 4)(function(response, meta) {
         response.tracks = 12;
         db.save(response)(); // here we use the provided default callbacks that log the result
       });

##### Check out the `airport-test.js` file for more.

#### Noteworthy items

 - All operations return a function that takes two arguments (two functions: callback and errback). Therefore you *must* call it for something to happen: `db.get('bucket')()` (default callbacks), or `db.get('bucket', 'key')(mycallback, myerrback)`
 - These functions are passed in two arguments, the `response` and a `meta` object: `var mycallback = function(response, meta) {}`
 - Headers are exposed through `meta.headers` and the status code through `meta.statusCode`
 - All operations accept an `options` object as the last argument, which will be *mixed-in* with the defaults
 - If no `Content-Type` header is provided, `application/json` will be assumed - which in turn will be serialized into JSON
 - Link-walking is done through the map/reduce interface
 - If no `language` is provided in any map/reduce phase, `language: javascript` is assumed
 - http.Client queues all requests, so if you want to run requests in parallel you need to create one client instance for each request

#### TODO

 - Support most code/functionality described in
   => http://bitbucket.org/justin/riak/src/tip/doc/raw-http-howto.txt
   => http://bitbucket.org/justin/riak/src/tip/doc/js-mapreduce.org
   => http://blog.basho.com/2010/02/24/link-walking-by-example/
   => http://hg.basho.com/riak/src/tip/client_lib/javascript/

 - Multipart file uploads