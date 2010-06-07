## riak-js

A Javascript library for Riak

### Features so far

 - Sensible yet overridable defaults (init, per-request)
 - Operations: get, head, save, remove, walk, map/reduce
 - Available for node.js (v0.1.97+) and jQuery (browser) platforms; extensible to other implementations
 - Works on Riak 0.10+

### Set up

#### node.js

    npm install riak-js
    
    var Riak = require('riak-js/riak-node'), db = new Riak.Client();

#### jQuery (browser)

    <script type="text/javascript" src="riak.js"></script>
    <script type="text/javascript" src="riak-jquery.js"></script>

    var db = new Riak();

### An example session

#### Get and save a document

     db.get('albums', 4)(function(album, meta) {
         album.tracks = 12;
         db.save(album)(); // here we use the provided default callbacks that log the result
       });
       
#### Use the Map/Reduce API

    db.map({name: 'Riak.mapValuesJson'}).run('albums')()

Note: you can pass arrays of phases, too. Like

    db.link([{ bucket: a, tag: "_", keep: false }, { bucket: b, tag: "songs", keep: true }]).reduce({name: 'Riak.myReduce'}).run('albums')()

#### Save an image

    fs.readFile("/path/to/your/image.jpg", 'binary', function (err, data) {
      if (err) throw err;
      db.save('images', 'test', data, { requestEncoding: 'binary', headers: { "content-type": "image/jpeg"} })();
    });


Check out the tests for more.

### Defaults

All operations take an `options` object as the last argument. These specified options will override the defaults, which are defined as:

    {
      clientId: 'riak-js', 
      method: 'GET',
      interface: 'riak',
      headers: {},
      debug: true,
      callback: function(response, meta) {
        if (response)
          Riak.prototype.log(meta.headers['content-type'] === 'application/json' ? JSON.stringify(response) : response)
      },
      errback: function(response, meta) {
        if (response)
          Riak.prototype.log((meta ? meta.statusCode + ": " : "") + response, 'error')
      }
    }

During client instantiation, defaults are `localhost` for the host and `8098` for the port. If you pass-in the `defaults` as an argument, they will apply to the whole session instead of per-request:

    var db = new Riak.Client({ host: 'localhost', port: 8098, interface: 'bananas', debug: false });

Note that you cannot change host or port on the instantiated client.

### Noteworthy points

 - All operations return a function that takes two arguments (two functions: callback and errback). Therefore you *must* call it for something to happen: `db.get('bucket')()` (default callbacks), or `db.get('bucket', 'key')(mycallback, myerrback)`
 - These functions are passed in two arguments, the `response` object and a `meta` object: `var mycallback = function(response, meta) {}`
 - Headers are exposed through `meta.headers` and the status code through `meta.statusCode`
 - All operations accept an `options` object as the last argument, which will be *mixed-in* as to override certain defaults
 - If no `Content-Type` header is provided, `application/json` will be assumed - which in turn will be serialized into JSON
 - Link-walking is done through the map/reduce interface
 - If no `language` is provided in any map/reduce phase, `language: javascript` is assumed
 - `http.Client` queues all requests, so if you want to run requests in parallel you need to create one client instance for each request
 
### Authors and contributors (in no particular order)

   - frank06
   - siculars
   - freshtonic
   - botanicus

### TODO

 - Make it more convenient to work with Content-Types / MIME types / binary files (use shortcuts instead of accessing the more verbose HTTP header)