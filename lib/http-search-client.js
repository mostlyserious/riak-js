var XML = require('xml'),
    HttpMeta = require('./http-meta');

var HttpSearchClient = function HttpSearchClient(options) {
  this._client = options['client'];
  this._defaults = {resource: 'solr', method: 'get'};
}

HttpSearchClient.prototype.add = function(index, document, callback) {
  var meta = new HttpMeta(this._defaults, {}, {method: 'post', callback: callback, bucket: index + '/update', contentType: 'xml'});
  meta.loadData(add(document));
  this._client._execute(meta);
}

HttpSearchClient.prototype.remove = function(index, documents, callback) {
  var meta = new HttpMeta(this._defaults, {}, {method: 'post', callback: callback, bucket: index + '/update', contentType: 'xml'});
  meta.loadData(remove(documents));
  this._client._execute(meta);
}

HttpSearchClient.prototype.find = function(index, query, options, callback) {
  var meta = new HttpMeta(this._defaults, options, {callback: callback, bucket: index + '/select', q: query, wt: 'json', });
  this._client._execute(meta);
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
