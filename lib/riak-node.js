var sys = require('sys'),
  http = require('http'),
  querystring = require('querystring'),
  Riak = require('./riak'),
  Meta = require('./meta');

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
      meta = new Meta(response.headers, self.defaults.interface,
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

module.exports = Riak