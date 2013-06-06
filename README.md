# riak-js

[Node.js](http://nodejs.org/) client for [Riak](http://basho.com/riak/).

[![Build Status](https://secure.travis-ci.org/mostlyserious/riak-js.png?branch=master)](https://travis-ci.org/mostlyserious/riak-js)

### Installation

    npm install riak-js

### Features and documentation

[Documentation](http://riak-js.org/)

Follow updates on Twitter: [@riakjs](http://twitter.com/riakjs)

### Changelog

#### 0.10.2

  - Fix HTTP status codes intepreted as errors when using the connection pool
    (github.com/chirag04 and github.com/domasx2)

#### 0.10.1

  - Support for HTTP connection pooling (github.com/andrewjstone)
  - Fix unwanted errors in ping and save operation callbacks
    (github.com/matehat)

#### 0.10.0

 - Preliminary support for Protocol Buffers via a single connection.
 - Fetch siblings by default, restoring previous riak-js behavior
 - Populate meta.links when saving an object based on the response's HTTP
   headers (github.com/accelerated)
 - Fix content length override. Allows handing in streaming data from e.g.
   connect.js. (github.com/englercj)
 - Only set the language attribute on map and reduce phases. Avoid setting it on
   phases where it's not according to spec. (github.com/accelerated)

#### 0.9.3
  
 - Switch testing framework to mocha/should.js (github.com/kenperkins)
 - Remove requirement of a Unix system from package.json (github.com/yawnt)
 - Fix a global leak of HttpSearchMeta (github.com/brianedgerton)

#### 0.9.2

 - Fix Search options so it handles hostname and port (github.com/kenperkins)
 - Fix unwanted vector clock overwriting during link walking (github.com/TauZero)
 - Handle connection errors gracefully so that they don't kill the process

#### 0.9.1

 - Request instrumentation for metrics, logging, etc.
 - Fix a leak in Httpmeta (github.com/rkusa), (#134)
 - Handle content length properly for Unicode data (#132)
 - Fix MapReduce options so it handles hostname and port (github.com/spencergibb)
 - Add support for link-walking (github.com/TauZero) 
 - Handle JSONified error messages (github.com/spencergibb)
 - Fix parsing of links on get requests (github.com/TauZero)

#### 0.9.0

 - Complete rewrite in JavaScript (two reasons: better debugging in production deployments, and more people can contribute)
 - Support Riak 1.0 features
 - First class support for streams (Luwak, key listing, Map/Reduce, logging)
 - Faster testing with node-seq + assert
 - Extra HTTP headers can now be passed in via `headers` (for instance custom usermeta, `X-Riak-Meta-*`) - these *will* override whatever has been set elsewhere
 - `addSearch` is now `search`
 - The project is open for other implementations
 - Removed Protocol Buffers support – contributions welcome (extend `Client` in a file called `protobuf-client.js` along with a `protobuf-meta.js`)
 - A client-side impl is also possible (look at https://github.com/ded/reqwest)
 - Support for Riak Search, including adding and removing documents directly.
   Search is namespaced on the client separately: `riak.search.find('users',
   'email:test@example.com')`
 - Moved MapReduce to a separate namespace on the client to separate concerns in
   a nicer way: `riak.mapreduce.add('users').run()`

##### TODO

 - Unify `meta` in all responses (check `getAll`, chunked map/reduce) - meta should allow for fine-grained mappings
 - SSL support
 - Use path internally but don't expose it as API (see `path` branch), to prepare for new URIs in Riak 1.0
 - More rigorous test suite (port from master)

##### LATER
 - Integrate test backend
 
#### 0.4.1

 - Add search params [gpascale]
 - SSL client [isaacs]
 - Last-modified date patch [siculars]
 - Add `meta.noError404` so that you can prevent 404s from showing up as errors [syrio]
 - Deprecation warnings

#### 0.4.0

 - `db.update`: convenience method for updating documents
 - Changed debug behaviour: always log to stdout. Not providing a callback **will** output to `console.log` regardless of the setting

#### 0.4.0rc3

 - Allow headers to override, useful for reverse proxies sitting between node and Riak
 - URI-encoding bucket/key is now an option (encodeUri)
 - Add documentation for map/reduce arguments
 - Remove agent from meta, which should fix critical bug (#64, #67)
 - Allow logging to alternate streams. And default to stderr, not stdout (thanks Mark!)
 - Add docs for host/port (thanks Ken!)
 - Add the new `presort` property for Riak Search (thanks Greg!)

#### 0.4.0rc2

 - Major docs update => [http://riak-js.org](http://riak-js.org)
 - `keys=stream` emits `keys` events
 - `walk` now accepts `noJSON`
 - Support Map/Reduce timeout option
 - Protobuf interface refactor (still experimental support in 0.4)
 - Minor bug fixes

#### 0.4.0rc1

 - node 0.4.x compatibility
 - npm 1.0 compatibility
 - Minor bug fixes

#### 0.3.6

 - Fix index.js and package.json for npm compat
 - Fix recursing usermeta
 - Fix for luwak location parsing
 - Updates related to Riak Search operations

#### 0.3.0beta6

 - Test backend implementation
 - Connect session store
 - Protobuf parsing is now more robust
 - Replace client every time ECONNREFUSED occurs
 - Initial Riak Search support
 - Minor bugfixing and internals refactoring

#### 0.3.0beta5

 - Add support for bucket listing in HTTP (new Riak 0.14 feature)
 - Updated to CoffeeScript 1.0.0
 - Fixed a memory leak caused by adding too many Event Listeners
 - If there's no `vclock` present in a Meta, do not send any `clientId`


### License

Simplified BSD License

Copyright 2011 Francisco Treacy. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are
permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice, this list of
      conditions and the following disclaimer.

   2. Redistributions in binary form must reproduce the above copyright notice, this list
      of conditions and the following disclaimer in the documentation and/or other materials
      provided with the distribution.

THIS SOFTWARE IS PROVIDED BY FRANCISCO TREACY ''AS IS'' AND ANY EXPRESS OR IMPLIED
WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL FRANCISCO TREACY OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

The views and conclusions contained in the software and documentation are those of the
authors and should not be interpreted as representing official policies, either expressed
or implied, of Francisco Treacy.
