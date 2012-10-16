var XML = require('xml'),
    HttpSearchMeta = require('./http-search-meta');

var HttpSearchClient = function HttpSearchClient(callback) {
  this._execute = callback;
  this._defaults = {resource: 'solr', method: 'get'};
}

HttpSearchClient.prototype.add = function(index, document, callback) {
  var documents = [].concat(document);
  this.update(index, add(documents), callback);
}

HttpSearchClient.prototype.remove = function(index, document, callback) {
  var documents = [].concat(document)
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

function remove(documents) {
  var xml = {delete: documents};
  return XML(xml);
}

module.exports = HttpSearchClient;
