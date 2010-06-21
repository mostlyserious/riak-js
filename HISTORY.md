Wishlist
--------

* Auto-reconnect to several hosts
* Update and enhance tests (`airline-test.js` to simulate real-world behaviour, add people from Faker.js to flights)
* Specify timeouts
* Provide an accurate clientId, bound to user/machine (even in the browser)

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