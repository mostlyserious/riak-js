var HttpSearchClient = function HttpSearchClient(options) {
  this._client = options['client'];
  this._defaults = {resource: 'solr', method: 'get'};
}

HttpSearchClient.prototype.add = function(){
  var meta = new Meta(this._client._defaults, options, {method: 'post', callback: callback});
}

HttpSearchClient.prototype.find = function(index, query, options, callback) {
  var Meta = this._client._metaType(options);
  var meta = new Meta(this._defaults, options, {callback: callback, bucket: index + '/select', q: query, wt: 'json'});
  this._client._execute(meta);
}

module.exports = HttpSearchClient;
