# riak-js

[Riak](http://riak.basho.com) Javascript library for [node.js](http://nodejs.org/).

### Installation

    npm install riak-js@latest

### Development

If you clone the repository or download a tarball from github you will need CoffeeScript.

It can be installed via `brew install coffee-script` or `npm install coffee-script`.

Simply execute `cake dev` to start continuous compilation.

Test with `cake test`. Requires [Vows](http://vowsjs.org) 0.5.2.

### Features and documentation

[http://riakjs.org](http://riakjs.org)

### Changelog

#### 0.3.0beta5

 - Add support for bucket listing in HTTP (new Riak 0.14 feature)
 - Updated to CoffeeScript 1.0.0
 - Fixed a memory leak caused by adding too many Event Listeners
 - If there's no `vclock` present in a Meta, do not send any `clientId`