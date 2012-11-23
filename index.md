---
layout: page
---
# riak-js

#### [Node.js](http://nodejs.org) [Riak](http://riak.basho.com) client.
      
    db.save('airlines', 'KLM', {fleet: 111, country: 'NL'}, { links:
      [{ bucket: 'flights', key: 'KLM-8098', tag: 'cargo' },
       { bucket: 'flights', key: 'KLM-1196', tag: 'passenger' }]
    })

* For Riak 0.12+ and node.js 0.4.x
* Code: <http://github.com/mostlyserious/riak-js>
* License: [MIT](http://opensource.org/licenses/mit-license.php)

## Setup
      
**Please note:** Protocol Buffers currently aren't supported
      
    // npm install riak-js@latest
    var db = require('riak-js').getClient()

    // git clone git://github.com/mostlyserious/riak-js.git  # or cloning the repo
    var db = require('/path/to/riak-js/lib').getClient()

    // configure the host and port
    var db = require('riak-js').getClient({host: "riak.myhost", port: "8098"});

## Guide

    db.get('flights', 'KLM-5034', function(err, flight, meta) {
      if (err) throw err;
      flight.status = 'delayed';
      meta.links.push({ bucket: 'airlines', key: 'IBE', tag: 'operated_by' });
      db.save('flights', 'KLM-5034', flight, meta);
    })

### Meta

Meta is an important concept in riak-js. It is a
*implementation-agnostic* object that carries all metadata associated to
a document, such as the bucket, key, vclock, links, and so on.  It is meant to
be *recycled* &mdash; all properties that make sense to be updated for a
subsequent store operation can be modified and sent back.  Any given properties
that aren't used by Riak are assumed to be custom metadata for Riak values.
This will become more clear as we go through the guide.

An example `meta` object could look like:
      
    { bucket: 'riakjs_airlines'
    , key: 'CPA'
    , usermeta: { important: false }
    , _type: 'application/json'
    , binary: false
    , links: 
     [ { tag: 'flight'
       , key: 'CPA-729'
       , bucket: 'riakjs_client_test_flights'
       }
     ]
    , raw: 'riak'
    , clientId: 'riak-js'
    , host: 'localhost'
    , vclock: 'a85hYGBgymDKBVIsTO+1QzKYEhnzWBm+rRc6xgcRZmtOYvg6tx4q8QMkkQUA'
    , lastMod: 'Sat, 25 Sep 2010 17:40:08 GMT'
    , etag: '8I9CsEwo8kScElgvCOC0k'
    , statusCode: 200
    }

Riak properties such as `'contentType', 'vclock', 'clientId', 'links', 'etag',
'r', 'w', 'dw', 'returnbody'` can all be set on this object. It also contains
handy methods to deal with links, and provides **sensible defaults**, which can
of course be overridden.  Examples are `contentType: 'application/json'` and
`clientId: 'riak-js'`.

Not only these are tunable per-request. If you need certain defaults to apply to
the whole session, provide them at initialization time:
`getClient({clientId: 'lan-27', raw: 'data', debug: true})`.

    fs.readFile("drunk-pilot.png", 'binary', function (err, image) {
      if (err) throw err;
      db.save('evidence', 'pilot-smith-drunk', image, { contentType: 'jpeg', immediateAction: 'fire' })
    });

*Note that `'jpeg'` is a shortcut and `immediateAction` is custom metadata.*

`Buffer`s are only returned when the `responseEncoding` property is set to `binary`.
This happens automatically for known binary types, such as `image/*`, `video/*` or
`application/octet-stream`, otherwise you have to provide it through `Meta`.

#### URI-encoded bucket/keys

An option (`Meta` property) `encodeUri` can be set to `true` when you want to
have your bucket and key URI-encoded. The default is `false` because `Meta` is
implementation-agnostic, and this only makes sense for HTTP clients.</p>

#### HTTP headers

You can pass in a `headers` options that will override any previously set
header. Useful to set other headers if you have a reverse proxy sitting between
node and Riak. *Use with caution*.

    db.get('flights', 'KLM-5034', { headers: { Authorization: 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==' } })

#### Content detection

If you don't provide a content type while sending a request body, riak-js will
do its best to guess one:

* If your data is a `Buffer` it will assume `application/octet-stream`
* If your data is a Javascript object whose `typeof` yields `object`, it will
  assume `application/json`
* Otherwise, `text/plain`

### Callbacks

    db.save('flights', 'KLM-5034', flight)

riak-js follows the Node convention: last argument is the callback, whose first
argument is the error object. Besides, the client will also emit the
`clientError` event.
 
If you don't provide a callback the result will **always** be logged through
`console.log`. You can choose to enable debugging via the `{ debug: true }`
option.

### API

**All** commands take **two** optional last arguments: `meta` (options) and `callback`,
in that order, and so they will not necessarily be shown below.

#### Get

    db.get('airlines', 'KLM')

A typical response would be:

    { name: 'KLM'
    , fleet: 111
    , alliance: 'SkyTeam'
    , european: true
    }

If, however, there is a *sibling conflict* (when `allow_mult = true`) then a typical response would have a `meta.statusCode = 300` and would look like:

    [ { meta: 
        { bucket: 'airlines'
        , key: 'KLM'
        , usermeta: {}
        , _type: 'application/json'
        , binary: false
        , links: []
        , raw: 'riak'
        , clientId: 'riak-js'
        , host: 'localhost'
        , lastMod: 'Sun, 26 Sep 2010 16:28:17 GMT'
        , etag: '5QDmB8ezT8hpMNX9Ias8DU'
        , vclock: 'a85hYGBgymDKBVIsTO+1QzKYEhnzWBkWfhA+xgcRZmtOYlvXp4MskQUA'
        }
      , data: { name: 'KLM'
      , fleet: 111
      , alliance: 'SkyTeam'
      , european: true
      }
    }
    , { meta: 
        { bucket: 'airlines'
        , key: 'KLM'
        , usermeta: {}
        , _type: 'application/json'
        , binary: false
        , links: []
        , raw: 'riak'
        , clientId: 'riak-js'
        , host: 'localhost'
        , lastMod: 'Sun, 26 Sep 2010 16:28:17 GMT'
        , etag: '4wz9tAlKC49RVqQmhcAvHz'
        , vclock: 'a85hYGBgymDKBVIsTO+1QzKYEhnzWBkWfhA+xgcRZmtOYlvXp4MskQUA'
        }
    , data: { name: 'KLM'
        , fleet: 113
        , alliance: 'SkyTeam'
        , european: true
      }
    } ]

#### Head

Head will only get the `meta` object back &mdash; no data. (It uses the HTTP HEAD verb under the hood.)

    db.head('airlines', 'KLM')

#### Exists

Exists is a shortcut to tell you if a document exists or not. Internally, it uses `head` and checks for a `404`.

    db.exists('airlines', 'AIR_FRIGGIN_MADRID')
        
#### Get all

Just like as with the *sibling conflict*, `getAll` will return an `Array` of `Object`s
with the `meta` and `data` properties.

    db.getAll('airlines')

    db.getAll('airlines', { where: { country: 'NL', fleet: 111 } })

#### Buckets

    db.buckets()

#### Keys

    db.keys('airlines')

##### Streaming keys

    db.keys('airlines', { keys: 'stream' }).on('keys', console.dir).start()

Yes, in this case `db.keys` will return an `EventEmitter`. It will emit both the `keys` and `end` events.

#### Count

    db.count('airlines')

#### Link-walking

    db.walk('airlines', 'KLM', [["_", "flight"]])

Provide `{ noJSON: true }` if you are not targeting JSON data!

#### Save

    db.save('airlines', 'ARG', { name: 'Aerolíneas Argentinas', fleet: 40, european: false })

    db.save('flights', 'KLM-5034', flight, { returnbody: true, dw: 'quorum', method: 'POST' })

#### Remove

    db.remove('airlines', 'KLM')

#### Map/Reduce

Three variations of the same query:

    db.mapreduce.add('flights').map('Riak.mapValuesJson').run()

    db.mapreduce.add('flights').map({name: 'Riak.mapValuesJson', keep: true }).run()

    db.mapreduce.add('flights').map(function(v) { return [Riak.mapValuesJson(v)[0]] }).run()

You can chain any number of phases or pass arrays, too:

    db.mapreduce
      .add('airlines')
      .link({ bucket: 'flights', keep: false })
      .map('Riak.mapValuesJson')
      .reduce(['Riak.filterNotFound', function(value, count) { return value.slice(0, count - 1) }])
      .run(function(err, flights) {
      console.log(flights)
    })

If you need to pass-in arguments, both `map` and `reduce` accept a second argument that will end up as the third of the map function:

    db.mapreduce.add('flights').map(function (value, keyData, arg) { /* do something with arg == { cancelled: true } */ }, { cancelled: true })

You can also use key filters:

    db.mapreduce.add({ bucket: 'flights', key_filters: [["matches", "KLM"]] }).map('Riak.mapValuesJson').run()

For input syntax [follow the API](http://wiki.basho.com/Key-Filters.html#Example-query-solutions). `add` simply takes the value of the `inputs` property.

#### Luwak

*Note that Luwak is not included in Riak's distribution anymore.* To use it, you'll have to download
and install it manually.

These commands (`getFile`, `saveFile`, `removeFile`) behave much like their
counterparts `get`, `save`, `remove`.  Except they don't take a `bucket`
argument, internally reference the `luwak` raw resource, and always use
`responseEncoding = 'binary'` therefore returning `Buffer`s.
  
    db.getFile('lowcost-pilot')
    
    db.saveFile('lowcost-pilot', buffer)

    db.removeFile('lowcost-pilot')

#### Ping

*Note: this command **only** takes an optional `callback`*

    db.ping()

#### Stats

*Note: this command **only** takes an optional `callback`*

    db.stats()

#### Update bucket properties

    db.saveBucket('airlines', {n_val: 8, allow_mult: true})

#### Get bucket properties

    db.getBucket('airlines', function(err, properties) {
      console.log(properties.pw)
    })

#### Search

    db.saveBucket('airlines', {search: true})
    db.save('airlines', 'FYI-8098', 'this is a plain text flight')

    db.search.find('airlines', 'text')

or in a Map/Reduce scenario:

    db.mapreduce.search('airlines', 'text').map('Riak.mapValues').run()

You can also add or remove documents directly to a search index:

    db.search.add('airlines', {id: 'Lufthansa', country: 'DE'});

    // adding multiple documents is also possible
    db.search.add('airlines', [{id: 'American Airlines', country: 'US'},
                               {id: 'Aer Lingus', country: 'IE'}]);

    db.search.remove('airlines', {id: 'Aer Lingus'})
    db.search.remove('airlines', [{id: 'Lufthansa'}, {country: 'US'}])

#### Secondary Indexes

*Note: to use secondary indexes, make sure to have your Riak configured to use the
[LevelDB
backend](http://docs.basho.com/riak/latest/cookbooks/Secondary-Indexes---Configuration/#Configuration).*

To add objects to the index, simply specify the desired indexes and their values
when storing it:

    db.save('airlines', 'KLM', {country: 'NL', established: 1919}, {index: {country: 'NL', established: 1919}});

riak-js will automatically pick the right kind of index, binary or numerical,
depending on the value specified.

Now you can query the index:

    db.query('airlines', {country: 'NL'});

To query a range, use an array:

    db.query('airlines', {established: [1900, 1920]});

A query returns a list of keys. You can feed the query into MapReduce to fetch
the values.

    db.mapreduce.add(
      {bucket: 'airlines', index: 'established_int', start: 1900, end: 1920}).
        map('Riak.mapValuesJson').run()

### Instrumenting Requests

To track metrics, add logging, or do other practical things around the lifecycle
of a request in riak-js, you can add event listeners to the client object to
register for different events. Currently available are:

- riak.request.start: Before the request is sent
- riak.request.request: When the response was received
- riak.request.finish: When collecting request output finished
- riak.request.end: When processing the request ended

To register for an event, e.g. to log a line when a request is sent, register a
listener with the client object.

    db.registerListener({
      "riak.request.start": function(event) {
        console.log(event.method + ' ' + event.path);
      }
    })

You can find more examples for using instrumentation [in the
repository](https://github.com/mostlyserious/riak-js/tree/master/examples), e.g.
to instrument the code to collect metrics for request times.

## Development

### Follow riak-js on Twitter: [@riakjs](http://twitter.com/riakjs)

### Issues

Please report issues[here](http://github.com/mostlyserious/riak-js/issues)

### Testing

Checkout the `test` folder.
Test with `make test`.

### Authors and contributors, in order of appearance

* [frank06](http://github.com/frank06)
* [ siculars ](http://github.com/siculars)
* [ freshtonic ](http://github.com/freshtonic)
* [ botanicus ](http://github.com/botanicus)
* [ technoweenie ](http://github.com/technoweenie)
* [ seancribbs ](http://github.com/seancribbs)
