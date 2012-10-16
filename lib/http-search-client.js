var XML = require('xml'),
    HttpMeta = require('./http-meta');

var HttpSearchClient = function HttpSearchClient(options) {
  this._client = options['client'];
  this._defaults = {resource: 'solr', method: 'get'};
}

HttpSearchClient.prototype.add = function(index, document, options, callback) {
  var meta = new HttpMeta(this._defaults, options, {method: 'post', callback: callback, bucket: index + '/update', contentType: 'xml'});
  meta.loadData(toXML(document));
  this._client._execute(meta);
}

HttpSearchClient.prototype.find = function(index, query, options, callback) {
  var meta = new HttpMeta(this._defaults, options, {callback: callback, bucket: index + '/select', q: query, wt: 'json', });
  this._client._execute(meta);
}

function toXML(document) {
  var doc = [];
  for (var attr in document) {
    doc.push({field: [{_attr: {name: attr}}, document[attr]]});
  }
  var xml = {add: [{doc: doc}]};
  return XML(xml);
}

module.exports = HttpSearchClient;
