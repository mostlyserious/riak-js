var XML = require('xml'),
    HttpSearchMeta = require('./http-search-meta');

/**
 * Initialize a Riak Search client.
 * Expects only a callback that's call to execute a search query, e.g.
 * in the HttpClient, therefore doesn't have any coupling to the
 * underlying transport.
 *
 * @param {Object} options
 * @param {Function} callback(meta)
 */
var HttpSearchClient = function HttpSearchClient(options, callback) {
  this._execute = callback;
  this._defaults = {resource: 'solr', method: 'get'};

  // need to add the options to the defaults object so as to not overwrite them
  // for the calling http-client

  if (options.host) {
    this._defaults.host = options.host;
  }

  if (options.port) {
    this._defaults.port = options.port;
  }

  if (options.client) {
    this._defaults.client = options.client;
  }
}

/**
 * Add one or more object to the Riak Search index.
 * The object is expected to have at least a property named id,
 * which is required by Riak Search.
 * documents can either be a single objects or an array of objects.
 *
 * @param {String} index
 * @param {Object|Array} documents
 * @param {Function} callback(err, data, meta)
 *
 * @api public
 */
HttpSearchClient.prototype.add = function(index, documents, callback) {
  documents = [].concat(documents);
  this.update(index, add(documents), callback);
}

/**
 * Removes an object from the Riak Search index.
 * The documents to be removed are expected to be represented by
 * single objects with either an id or a query property.
 * The query property determines a set of documents to be removed
 * while the id property describes a specific document.
 *
 * @param {String} index
 * @param {Array} documents
 * @param {Function} callback(err, data, meta)
 *
 * @api public
 */
HttpSearchClient.prototype.remove = function(index, documents, callback) {
  documents = [].concat(documents)
  this.update(index, remove(documents), callback);
}

/**
 * Find a set of documents in Riak Search in the specified index.
 * The query must be a valid query string as described in the Riak Search
 * documentation.
 *
 * The options can include all query options supported by Riak Search.
 *
 * @param {String} index
 * @param {String} query
 * @param {Object} options
 * @param {Function} callback(err, data, meta
 */
HttpSearchClient.prototype.find = function(index, query, options, callback) {
  var meta = new HttpSearchMeta(this._defaults, options, {callback: callback, index: index, operation: 'select', q: query, wt: 'json', });
  this._run(meta);
}

HttpSearchClient.prototype._run = function(meta) {
  var callback = meta.callback;
  meta.callback = function(err, data, meta) {
    callback(err, data.response, meta);
  }
  this._execute(meta);
}

/**
 * Update the search index.
 *
 * The data is expected to be already serialized in the format required by
 * Riak Search, i.e. XML.
 *
 * @param {String} index
 * @param {String} data
 * @param {Function} callback(err, data, meta)
 *
 * @api private
 */
HttpSearchClient.prototype.update = function(index, data, callback) {
  var meta = new HttpSearchMeta(this._defaults, {}, {method: 'post', callback: callback, index: index, operation: 'update', contentType: 'xml'});
  meta.loadData(data);
  this._execute(meta);
}

/**
 * Generate XML to add documents to the Search index.
 *
 * @param {Array} documents
 *
 * @api private
 */
function add(documents) {
  var add = [];
  for (var document in documents) {
    var doc = [];
    for (var attr in documents[document]) {
      doc.push({field: [{_attr: {name: attr}}, documents[document][attr]]});
    }
    add.push({doc: doc});
  }
  var xml = {add: add};
  return XML(xml); 
}

/**
 * Generate the XML to remove a set of documents from the Search index.
 *
 * @param {Array} documents
 *
 * @api private
 */
function remove(documents) {
  var xml = {delete: documents};
  return XML(xml);
}

module.exports = HttpSearchClient;
