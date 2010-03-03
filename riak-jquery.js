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
  if (typeof console !== 'undefined') {
    console.log('[riak-js] ' + (error ? 'ERROR: ' : '') + message);
  }
}

Riak.prototype.stringifyQuery = function(query) {
  return $.param(query);
}

Riak.prototype.mixin = function(target, obj1, obj2) {
  return $.extend(true, target, obj1, obj2);
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

    var path = '/' + options.interface + '/' + url + (query ? ('?' + query) : '');
    self.log(options.method.toUpperCase() + ' ' + path);

    // *** //

    function getMeta(xhr) {
      var meta = {}, h = xhr.getAllResponseHeaders();
      meta.statusCode = xhr.status;
      for (p in h) {
        meta.headers[p] = h[p];
      }
      return meta;
    }

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
       success: function(data, textStatus, xhr) {
         db.log(db.toJSON(getMeta(xhr)));
         db.log('success callback: ' + db.toJSON(callback));
         db.log('data: ' + data);
         callback(data, getMeta(xhr));
       },
       error: function(xhr, message, error) {
         db.log('error errback: ' + db.toJSON(errback));
         errback(message, getMeta(xhr), error);
       }
    };

    self.client.ajax(request);

  }
}