Wishlist
--------

* Auto-reconnect to several hosts
* Update and enhance tests (`airline-test.js` to simulate real-world behaviour, add people from Faker.js to flights)
* Specify timeouts
* Provide an accurate clientId, bound to user/machine (even in the browser)

=> dox
=> vows / merge airline tests and introduce fake passengers with faker
=> many of the headers should go in the defaults, instead of so much setup
=> search for err & throws, go for node like api function(err, resp, meta)
=> links uri-unescape
=> "keys" support
=> check possible merge with technoweenie/nori
=> one client enough for parallel?
=> issue 6 / test jquery version / transporter for jquery

DONE
=> modularize code, use require()
=> docs: getAll(where)
=> changed license to MIT
=> Meta prototype.__defineGetter__('links', function() {}) // change your calls from meta.links() to meta.links

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