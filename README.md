# riak-js

[Riak](http://riak.basho.com) Javascript library for [node.js](http://nodejs.org/).

[jQuery](http://jquery.com/) support is currently not working and will probably be dropped. E-mail me if you have strong feelings about it.

### Installation

    npm install riak-js

### Features and documentation

[http://riakjs.org](http://riakjs.org)

### Development

Run this in the main directory to compile coffeescript to javascript as you go:

    coffee -wc -o lib --no-wrap src/**/*.coffee

### Refactoring

There are two main objects in Riak-JS: Client and Meta.  Clients are instantiated the same way as before:

    // defaults to HTTP Client
    var db = require('riak-js').getClient({host: '127.0.0.1'})

    // returns HTTP Client
    var db = require('riak-js').http({host: '127.0.0.1'})

    // returns PBC Client
    var db = require('riak-js').protobuf({host: '127.0.0.1'})

    // also returns PBC Client
    var db = require('riak-js').getClient({
      api: 'protobuf', host: '127.0.0.1'})

Meta objects are different.  They know nothing of HTTP headers, they're just a bag of Riak properties.  Any given properties that aren't used by Riak are assumed to be custom metadata for Riak values.  Custom Meta extensions should know how to build HTTP headers or PBC objects.  The Riak-JS user shouldn't care how they're structured, though.

### Testing Philosophy

In my mind, there are three main types of tests in riak-js.  The simplest kind is the simple object tests (see `test/meta_test.coffee`).  These don't hit Riak, and are only sanity checks for various objects.

The second type is the high level integration tests for both client libs.  These make sure that common operations between the HTTP and PBC clients behave identically.  I've started on this in `test/protobuf_client_test.coffee`, but I want to move the common tests to a central spot.  

The third type is a set of client-specific tests.  There are a few methods on the PBC API that aren't really in the HTTP API.  I still want to support them, even if there isn't any support in the HTTP API.

I had a few issues with the default bitcask backend.  It might've just been a buggy early version of my code, but I switched to the riak ETS backend anyway.  This backend is in-memory, so it's much faster.  If I want to clear out any data, I can just restart riak.  It's really easy to swap out the backend if you want:

https://wiki.basho.com/display/RIAK/Configuration+Files#ConfigurationFiles-storagebackend