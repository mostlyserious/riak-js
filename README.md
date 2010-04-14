## riak-js

A Javascript library for Riak

### Features so far

 - Sensible yet overridable defaults (init, per-request)
 - Operations: get bucket, get doc, save, remove, walk, map/reduce
 - Available for node.js (v0.1.30+) and browser/jQuery platforms and Riak 0.8+
 - Tested on patched v0.1.90 (actually commit 4681e34) - only issues a deprecation warning

### Defaults

All operations take an `options` object as the last argument. These specified options will override the defaults, which are defined as:

    {
      method: 'GET',
      interface: 'riak',
      headers: {},
      callback: function(response, meta) {
        Riak.prototype.log(meta.headers['content-type'] === 'application/json' ? JSON.stringify(response) : response)
      },
      errback: function(response, meta) {
        Riak.prototype.log((meta ? meta.statusCode + ": " : "") + response, 'error')
      },
      returnbody: false,
      debug: true
    }

During client instantiation, defaults are `localhost` for the host and `8098` for the port. If you pass-in the `defaults` as the last argument, they will apply to the whole session instead of per-request:

    var db = new Riak.Client(8098, 'localhost', { interface: 'bananas', debug: false });

### Set up

#### node.js

    require.paths.unshift("lib");
    var Riak = require('riak-node'), db = new Riak.Client();

Also available through kiwi: `kiwi install riak-js`

#### In the browser with jQuery

    var db = new Riak();

### An example session

#### Get and save a document

     db.get('albums', 4)(function(album, meta) {
         album.tracks = 12;
         db.save(album)(); // here we use the provided default callbacks that log the result
       });

Check out the `airport-test.js` file for more.

#### Save an image

    fs.readFile("/path/to/your/image.jpg", 'binary', function (err, data) {
      if (err) throw err;
      db.save('images', 'test', data, { requestEncoding: 'binary', headers: { "content-type": "image/jpeg"} })();
    });

### Noteworthy points

 - All operations return a function that takes two arguments (two functions: callback and errback). Therefore you *must* call it for something to happen: `db.get('bucket')()` (default callbacks), or `db.get('bucket', 'key')(mycallback, myerrback)`
 - These functions are passed in two arguments, the `response` object and a `meta` object: `var mycallback = function(response, meta) {}`
 - Headers are exposed through `meta.headers` and the status code through `meta.statusCode`
 - All operations accept an `options` object as the last argument, which will be *mixed-in* as to override certain defaults
 - If no `Content-Type` header is provided, `application/json` will be assumed - which in turn will be serialized into JSON
 - Link-walking is done through the map/reduce interface
 - If no `language` is provided in any map/reduce phase, `language: javascript` is assumed
 - `http.Client` queues all requests, so if you want to run requests in parallel you need to create one client instance for each request

### TODO

 - Make it more convenient to work with Content-Types / MIME types / binary files
 - In-browser tests for the jQuery version
 - Support most code/functionality described in
   - http://bitbucket.org/justin/riak/src/tip/doc/raw-http-howto.txt
   - http://bitbucket.org/justin/riak/src/tip/doc/js-mapreduce.org
   - http://blog.basho.com/2010/02/24/link-walking-by-example/
   - http://hg.basho.com/riak/src/tip/client_lib/javascript/