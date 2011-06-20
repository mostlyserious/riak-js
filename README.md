# riak-js

[Node.js](http://nodejs.org/) client for [Riak](http://riak.basho.com) with support for HTTP and Protocol Buffers.

### Installation

    npm install riak-js@latest

### Development

If you clone the repository or download a tarball from github you will need CoffeeScript.

It can be installed via `brew install coffee-script` or `npm install coffee-script`.

Simply execute `cake dev` to start continuous compilation. You may also want to run `npm link` so that whenever you call `require('riak-js')` it will always point to the current dev version.

Test with `cake test` or `cake -s test`. Requires [Vows](http://vowsjs.org) 0.5.2.

### Features and documentation

[http://riakjs.org](http://riakjs.org)

Twitter: [@riakjs](http://twitter.com/riakjs)

### Roadmap

 - 0.4.1: Streaming: Map/Reduce, keys (Protobuf), Luwak
 - 0.4.1: Tests: should run way faster, integrate test backend
 - 0.5: Decent Protobuf and seamless interface for both APIs

### Changelog

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

Copyright (c) 2010-2011 Francisco Treacy, <francisco.treacy@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.