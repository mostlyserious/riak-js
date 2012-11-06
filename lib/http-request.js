var http = require('http'),
    crypto = require('crypto'),
    EventEmitter = require('events').EventEmitter;

var HttpRequest = function HttpRequest(client, meta) {
  this.meta = meta;
  this.client = client;
  this.instrumenter = new EventEmitter();
}

HttpRequest.prototype._uuid = function() {
  var hash = crypto.createHash('sha1');
  hash.update(crypto.randomBytes(256));
  return hash.digest('hex');
}

HttpRequest.prototype.execute = function() {
  var meta = this.meta;
  var self = this,
    callback = meta.callback,
    event = {
      method: (meta.method || "").toLowerCase(),
      path: meta.path,
      started_at: new Date(),
      uuid: this._uuid()
    };

  if (meta.logger) meta.logger.write('[riak-js] ' + meta.method.toUpperCase() + ' ' + meta.path + '\n');
  
  this.instrumenter.emit('request.start', event)

  var request = http.request(meta, function(response) {
    var headers = response.headers,
      buffer = [],
      boundary,
      tempBuffer = '';

    // remove agent
    delete meta.agent;
    
    meta.loadResponse(response);
    
    if (meta.stream) {
      return callback(null, response, meta);
    }
    
    response.on('data', function(chunk) {
      
      if (meta.transferEncoding == 'chunked' && meta._emitter) {
        
        // stream keys
        if (meta.keys == 'stream') {
          // only buffer the first chunk, the rest will be emitted
          if (buffer.length > 0) {
            buffer = chunk;
          } else {
          
            tempBuffer += chunk.toString();
        
            var m = tempBuffer.match(/\}\{|\}$/);
            if (m && m.index) { // whole or contiguous JSON chunks
            
              var head = tempBuffer.substr(0, m.index+1),
                tail = tempBuffer.substr(m.index+1);
              tempBuffer = tail;
          
              try {
                var keys = JSON.parse(head).keys;
                if (keys && keys.length) meta._emitter.emit('keys', keys);
              } catch (err) {
                this.emit('error', err);
              }
          
            }
        
          }
          
        }
        
        // chunked map/reduce
        if (meta.chunked && meta.boundary && meta.resource == 'mapred') {
          
          var chunks = meta._parseMultipartMixed(chunk.toString());
          
          // exactly the same as in `getAll`
          chunks.forEach(function(e) {
            var Meta = _metaType(meta);
            var _meta = new Meta({ contentType: e.headers['content-type'], data: e.body });
            meta._emitter.emit('data', _meta.parse(e.body));
          });
          
        }
        
      } else { // simply buffer
        buffer.push(chunk);
      }
      
    });
    
    response.on('end', function() {
      event.finished_at = new Date();
      self.instrumenter.emit('request.end', event)

      // if there is an emitter associated to this chunked response then emit 'end'
      if (meta._emitter) {
        meta._emitter.emit('end');
      }
      
      var bytesRead = buffer.reduce(function(p, c) { return p + c.length }, 0);
      var tempBuf = new Buffer(bytesRead),
          tempBytes = 0;
      buffer.forEach(function(chunk) {
        chunk.copy(tempBuf, tempBytes, 0, chunk.length);
        tempBytes += chunk.length;
      });
      buffer = tempBuf;
      
      try {
        buffer = meta.parse(buffer);
      } catch (e) {
        buffer = "Problem decoding: " + e.message;
      }
      
      // deal with errors
      if (meta.statusCode >= 400) {
        var err = new Error();
        err.message = buffer && buffer.toString().trim();
        err.statusCode = meta.statusCode;
        buffer = err;
      }
      
      if (meta.statusCode == 300 && meta.boundary) {
        var parts = meta._parseMultipartMixed(buffer);
        var Meta = _metaType(meta);
        buffer = parts.map(function(part) {
          var _meta = new Meta({data: part.body});
          _meta.loadResponse({
            headers: part.headers,
            statusCode: meta.statusCode
          })
          _meta.vclock = meta.vclock;
          return({
            meta: _meta, data: _meta.parse(_meta.data)
          })
        });
      }
     
      var err = null;
      
      if (buffer instanceof Error) {
        
        err = buffer;
        
        if (meta.statusCode === 404) {
          if (meta.noError404) {
            err = buffer = undefined;
          } else {
            err.notFound = true;
          }
        }
        
      }
      self.instrumenter.emit('request.finished', event);
      callback(err, buffer, meta);
    });
  });
  
  request.on('error', function(err) {
    self.instrumenter.emit('request.error', event)
    self.client.emit('error', err);
  });
  
  // write stream
  if (meta.data && meta.data.pipe) {
    meta.data.pipe(request);
    return; // we're done
  }
  
  if (meta.data) {
    request.write(meta.data, meta.contentEncoding);
    delete meta.data;
  }
  
  request.end();

}

module.exports = HttpRequest;
