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

Riak.prototype.executeInternal = function(self, path, options, callback, errback) {

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
       errback(message, getMeta(xhr), error);
     }
  };

  self.client.ajax(request);

  // helper
  function getMeta(xhr) {
    var meta = {}, headers = xhr.getAllResponseHeaders();
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

Riak.prototype.mixin = $.extend