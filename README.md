## riak-js

### A Javascript library for Riak

#### Features so far

 - Sensible but always overridable defaults
 - Operations: get (bucket or document), save, remove, walk, mapReduce
 - Currently only available for node.js v0.1.30+ - soon a browser/jQuery implementation
 - Tested with latest Riak tip (932:a98ed16a9d87)

#### Defaults

All operations take an _options_ object as the last argument. These specified options will override the defaults, which are defined as:

    {
      method: 'GET',
      interface: 'riak',
      headers: {},
      callback: function(response, meta) { Riak.prototype.log(response) },
      errback: function(response, meta) { Riak.prototype.log(meta.statusCode + ": " + response, 'error') },
      returnbody: false
    }

as well as `localhost` for the host and `8098` for the port.

#### Noteworthy items

 - All operations return a function that takes two arguments (two functions: callback and errback). Therefore you *must* call it for something to happen: `db.get('bucket')()`
 - These functions are passed in two arguments, the `response` and a `meta` object
 - Headers are exposed through `meta.headers` and the status code through `meta.statusCode`
 - All operations accept an `options` object which will be *mixed-in* with the defaults
 - If no `Content-Type` is provided in the headers, `application/json` will be assumed; which in turn will be serialized into JSON
 - Link-walking is done through the map/reduce facility (easier to handle responses)
 - If no `language` is provided in any map/reduce phase, `language: javascript` is assumed

#### An example session for node.js would be:

    require.paths.unshift(".");
    var Riak = require('riak-node'), db = new Riak.Client();

Get and save a document

     db.get('albums', 4)(function(response, meta) {
         response.tracks = 12;
         db.save(response)(); // here we use the provided default callbacks that log the result
       }, function(error_response, meta) {
         // something in case of error
     });

Check out the `airport-test.js` file for more.

// http.Client queues all requests, so if you want to run requests in parallel
// you need to create one client instance for each request