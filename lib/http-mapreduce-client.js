var Mapper = require('./mapper'),
    HttpMeta = require('./http-meta');

var HttpMapReduceClient = function HttpMapReduceClient(defaults, callback) {
  this._execute = callback;
  this._defaults = defaults;
}
/**
 * Add inputs for a Map/Reduce. Forms allowed:
 *
 *   - `String` for full-bucket scans
 *   - `Array` for a list of key/values
 *   - `Object` for key filters and further options. See Basho Map/Reduce documentation.
 * 
 * @param {String|Array|Object} inputs
 * @return {Mapper}
 * @api public
 */
HttpMapReduceClient.prototype.add =  function(inputs) {
  return new Mapper(inputs, this);
}

/**
 * Add inputs for a Map/Reduce from the result of a Riak Search query.
 *
 * @param {String} bucket - index
 * @param {String} query - Riak Search valid query
 * @return {Mapper}
 * @api public
 */
HttpMapReduceClient.prototype.search = function(bucket, query) {
  return this.add({ module: 'riak_search', function: 'mapred_search', arg: [bucket, query] });
}

/**
 * Submits a Map/Reduce job. Internally called by `Mapper#run`.
 *
 * @param {Object} job
 * @param {Object} options [optional]
 * @param {Function} callback(err, results, meta) [optional]
 * @api private
 */
HttpMapReduceClient.prototype._run = function(job, options, callback) {
  var meta = new HttpMeta(this._defaults, options, { resource: 'mapred', method: 'post', callback: callback }),
    callback = meta.callback;

  meta.loadData(job.data);
  
  if (meta.chunked) {
    
    meta.callback = function(err, data, _meta) {
      if (_meta) delete _meta._emitter;
      callback(err, data, _meta);
    };
    meta._emitter = new EventEmitter();
    meta._emitter.start = function() { this._client._execute(meta) }.bind(this);

    return meta._emitter;
    
  }
  
  this._execute(meta);

}

module.exports = HttpMapReduceClient;
