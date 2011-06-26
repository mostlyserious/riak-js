var http = require('http'),
  Meta = require('../lib/http_meta');

var HttpClient = function HttpClient(options) {}

HttpClient.prototype.get = function(bucket, key, options, callback) {
  var meta = new Meta(bucket, key, options);
  
  this._execute('GET', meta, callback);
  
}



// private


HttpClient.prototype._execute = function(verb, meta, callback) {
  
  var self = this;
  
  meta.method = verb.toUpperCase();
  meta.headers = meta.toHeaders();
  // Client.debug "#{meta.method} #{meta.path}", meta
  
  var request = http.request(meta, function(response) {
    
    response.setEncoding(meta.responseEncoding);
    
    var buffer = '';
    
    response.on('data', function(chunk) {
      buffer += chunk;
    });
    
    response.on('end', function() {
      meta = meta.loadResponse(response);
      
      if (meta.statusCode >= 400) {
        throw new Error(meta.statusCode);
      }
      
      try {
        buffer = meta.decode(buffer);
      } catch (e) {
        buffer = new Error('cannot convert resp');
      }
      
      var err = null;
      
      if (buffer instanceof Error) {
        // do sth
      }
      
      callback(err, buffer, meta);
      
    });
    
  });
  
  if (meta.data) {
    request.write(meta.data, meta.contentEncoding);
    delete meta.data;
  }
  
  // request.on('error') emit
  
  request.end();
  
}

c = new HttpClient();

c.get('test', 'error', {}, function(err, data) {
  console.log(data);
});