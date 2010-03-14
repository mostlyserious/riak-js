// This file is provided to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file
// except in compliance with the License.  You may obtain
// a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

var sys = require('sys'),
  http = require('http'),
  querystring = require('querystring');

var Riak = exports.Client = require('./riak').common;

Riak.prototype.getClient = function(port, host) {
  return http.createClient(port, host);
}

Riak.prototype.log = function(message, error) {
  if (this.defaults.debug) sys.puts('[riak-js] ' + (error ? 'ERROR: ' : '') + message);
}

Riak.prototype.stringifyQuery = function(query) {
  return querystring.stringify(query);
}

Riak.prototype.mixin = function(target, obj1, obj2) {
  // restore deep copy when bug #70 is fixed
  return process.mixin(target, obj1, obj2);
}

Riak.prototype.execute = function (url, options) {

  var self = this;
  options = Riak.prototype.mixin({}, this.defaults, options);

  return function(callback, errback) {

    callback = callback || options.callback;
    errback = errback || options.errback;

    if (options.headers['content-type'] === undefined) {
      options.headers['content-type'] = 'application/json';
    }

    if (options.headers['content-type'] === 'application/json') {
      try {
        options.data = self.toJSON(options.data);
      } catch (e) {} // no-op if error
    }

    var queryProperties = {};

    // known url params are added to the query
    ['r', 'w', 'dw', 'rw', 'nocache', 'returnbody', 'keys'].forEach(function(p) {
      if (options[p]) {
       queryProperties[p] = options[p];
      }
    });

    var query = self.toQuery(queryProperties);

    var path = '/' + options.interface + '/' + url + (query ? ('?' + query) : ''),
      request = self.client.request(options.method.toUpperCase(), path, options.headers);

    self.log(options.method.toUpperCase() + ' ' + path);
    // sys.debug(sys.inspect(options.headers));

    if (options.data) {
      request.write(options.data, options.requestEncoding || 'utf8');
    }

    request.addListener('response', function(response) {

      var buffer = "", meta = {};
      meta.headers = response.headers;
      meta.statusCode = status = response.statusCode;

      response.addListener('data', function(chunk) {
        buffer += chunk;
      });

      response.addListener('end', function() {

        if (status >= 400) {
          errback(buffer, meta);
        } else {
          if (status !== 204 && buffer !== '' && meta.headers['content-type'] === 'application/json') {
            try {
              callback(JSON.parse(buffer), meta);
            } catch (e) {
              errback(buffer, meta, "Couldn't parse it as JSON");
            }
          } else {
            callback(buffer, meta);
          }
        }

      })

    });
    request.close();
  }
}