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

 - 0.4.0: Flesh out last issues and release 0.4
 - 0.4.1: Streaming: Map/Reduce, keys (Protobuf), Luwak
 - 0.4.1: Tests: should run way faster, integrate test backend
 - 0.5: Decent Protobuf and seamless interface for both APIs

### Changelog

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