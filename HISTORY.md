Wishlist
--------

* Resilent to crashes, network errors, etc; auto-reconnect to several hosts
* Spawning 4 workers with `spark` is enough to have 4 parallel HTTP clients hammering Riak?
* Provide an accurate clientId, bound to user/machine (even in the browser?) - randomizing it on client init is a bad solution
* Work on future merge with technoweenie/nori
* Test with vows / merge airline tests and introduce fake passengers with faker
* Make jQuery version work and fix #6

DONE BEFORE RELEASE

=> modularize code, use require()
=> docs: getAll(where)
=> changed license to MIT
=> Added getter/setter for links // change your calls from meta.links() to meta.links, and meta.addLinks([...]) to meta.links = [...]
=> many of the headers should go in the defaults, instead of so much setup
=> links uri-unescape
=> added `db.error` convenience function to check for errors - still don't like node's `function(err, response)` standard
=> working "keys" (http://github.com/visionmedia/keys) implementation
=> API docs via dox

0.2.3 / 2010-06-21
------------------

* Removed errbacks -- now you only have to provide a callback and check `meta.statusCode` when needed. If some other error occurs, meta will be an empty object
* Added Map/Reduce API syntactic sugar, `meta` has now functions in its prototype allowing to retrieve (`links()`), add (`addLinks()` - pass in a link object or an array), and remove (`removeLink()`) methods.

    db.get(bucket, key)(function(r, meta) { p(meta.links()) })

* Shortcuts to HTTP headers in the `options` object - which leads to a better "link" and "type" API. You can now do `{ links: meta.links() }`. Or see how it's used in the `test` files.
* Ping operation (`db.ping()(function(r, meta) { puts(meta.statusCode) })`)

0.2 / 2010-06-06
----------------

* ETag support
* New Map/Reduce API
* Tests with expresso