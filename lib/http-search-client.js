var XML = require('xml'),
    HttpSearchMeta = require('./http-search-meta');

var HttpSearchClient = function HttpSearchClient(callback) {
  this._execute = callback;
  this._defaults = {resource: 'solr', method: 'get'};
}

HttpSearchClient.prototype.add = function(index, document, callback) {
  this.update(index, add(document), callback);
}

HttpSearchClient.prototype.remove = function(index, documents, callback) {
  this.update(index, remove(documents), callback);
}

HttpSearchClient.prototype.find = function(index, query, options, callback) {
  var meta = new HttpSearchMeta(this._defaults, options, {callback: callback, index: index, operation: 'select', q: query, wt: 'json', });
  this._execute(meta);
}

HttpSearchClient.prototype.update = function(index, data, callback) {
  var meta = new HttpSearchMeta(this._defaults, {}, {method: 'post', callback: callback, index: index, operation: 'update', contentType: 'xml'});
  meta.loadData(data);
  this._execute(meta);
}

function add(document) {
  var doc = [];
  for (var attr in document) {
    doc.push({field: [{_attr: {name: attr}}, document[attr]]});
  }
  var xml = {add: [{doc: doc}]};
  return XML(xml); 
}

function remove(documents) {
  var deleted = [];
  for (var i in documents) {
    deleted.push({id: documents[i]});
  }
  var xml = {delete: deleted};
  return XML(xml);
}

module.exports = HttpSearchClient;
