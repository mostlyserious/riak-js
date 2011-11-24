# riak-js

[Node.js](http://nodejs.org/) client for [Riak](http://riak.basho.com).

### Installation

    npm install riak-js

### Features and documentation

[Documentation](http://frank06.github.com/riak-js) [soon]

Follow updates on Twitter: [@riakjs](http://twitter.com/riakjs)

### Changelog

#### 1.0.0

 - Complete rewrite in Javascript (two reasons: better debugging in production deployments, and more people can contribute)
 - Support Riak 1.0 features
 - First class support for streams (Luwak, key listing, Map/Reduce, logging)
 - Faster testing with node-seq + assert
 - Extra HTTP headers can now be passed in via `headers` (for instance custom usermeta, `X-Riak-Meta-*`) - these *will* override whatever has been set elsewhere
 - `addSearch` is now `search`
 - The project is open for other implementations
 - Removed Protocol Buffers support – contributions welcome (extend `Client` in a file called `protobuf-client.js` along with a `protobuf-meta.js`)
 - A client-side impl is also possible (look at https://github.com/ded/reqwest)

##### TODO

 - get rid of setters? `.headers`, `.data`
 - Unify `meta` in all responses (check `getAll`)
 
 - HTTP 300 and multipart/mixed responses
 - Conflict resolution strategies
 - Link-walking (see https://github.com/frank06/riak-js/pull/98), and test everything related to links

 - Document code like in `connect-riak`
 - Integrate test backend
 - Checklist: go through old bug reports and patches, ensure the current behavior is correct

 - Pass urls as Array? check with the "new format" -- i.e. `/buckets/bucket/keys?keys=stream` [not sure, see branch `path`]

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

 - Major docs update => [http://riakjs.org](http://riakjs.org)
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