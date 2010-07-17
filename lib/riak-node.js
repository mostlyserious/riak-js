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
  querystring = require('querystring'),
  riak = require('./riak');

var Riak = exports.Client = riak.client,
  Meta = riak.meta;

Riak.prototype.getClient = function(port, host, options) {
  var client = http.createClient(port, host);

  client.addListener('end', function(had_error, reason) {
    if (had_error) {
      options.callback(reason + "(host: " + host + ", port: " + port + ")", {}); // empty meta
    }
  });
  
  //client.addListener('timeout', function () { client.end() });

  return client;

}

Riak.prototype.log = function(message, error) {
  if (this.defaults.debug) sys.puts('[riak-js] ' + (error ? 'ERROR: ' : '') + message);
}

Riak.prototype.stringifyQuery = function(query) {
  return querystring.stringify(query);
}

Riak.prototype.executeInternal = function(self, path, options, callback) {

  // self.client.setTimeout()
  var request = self.client.request(options.method.toUpperCase(), path, options.headers);

  if (options.data) {
    request.write(options.data, options.requestEncoding || 'utf8');
  }

  request.addListener('response', function(response) {

    var buffer = "",
      status = response.statusCode,
      location = response.headers['location'],
      meta = new Meta(response.headers,
        location ? location.substring(location.lastIndexOf('/')+1) : options.key,
        status);
	
    response.setEncoding(options.responseEncoding || 'utf8');

    response.addListener('data', function(chunk) {
      buffer += chunk;
    });

    response.addListener('end', function() {
      if (buffer && meta.headers['content-type'] === 'application/json') {
        try {
          buffer = JSON.parse(buffer);
        } catch (e) {
          buffer = new Error("Couldn't convert into JSON: " + e.message);
        }
      }
      callback(buffer, meta);
    })

  });

  request.end();
}