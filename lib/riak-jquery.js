Riak.prototype.getClient = function() {
  return jQuery;
}

Riak.prototype.log = function(message, error) {
  if (this.defaults.debug && typeof console === 'object') {
    console.log('[riak-js] ' + (error ? 'ERROR: ' : '') + message);
  }
}

Riak.prototype.stringifyQuery = function(query) {
  return $.param(query);
}

Riak.prototype.executeInternal = function(self, path, options, callback) {

  self.client.ajaxSetup({
  	beforeSend: function(xhr) {
  	  for (p in options.headers) {
  	    xhr.setRequestHeader(p, options.headers[p]);
  	  }
  	}
  });

  var request = {
     type: options.method.toUpperCase(),
     url: path,
     data: options.data,
     processData: false,
     contentType: options.headers['content-type'],
     success: function(data, textStatus, xhr) {
       callback(data, getMeta(xhr));
     },
     error: function(xhr, message, error) {
       callback(message, getMeta(xhr), error);
     }
  };

  self.client.ajax(request);

  // helper
  function getMeta(xhr) {
    var meta = new Meta();
    var headers = xhr.getAllResponseHeaders();
    meta.headers = {};
    meta.statusCode = xhr.status;
    if (headers.length) {
      headers.split('\r\n').forEach(function(header) {
        // header of type: Content-Length: 146
        var i = header.indexOf(':');
        meta.headers[header.substring(0, i).toLowerCase()] = header.substring(i+2);
      });
    }
    var location = meta.headers['location'];
    meta.key = location ? location.substring(location.lastIndexOf('/')+1) : options.key;
    return meta;
  }

}