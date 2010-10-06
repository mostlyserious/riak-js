var CoreMeta, Meta;
var __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
CoreMeta = require('./meta');
Meta = function() {
  return CoreMeta.apply(this, arguments);
};
__extends(Meta, CoreMeta);
Meta.prototype.load = function(options) {
  return Meta.__super__.load.call(this, options);
};
Meta.prototype.withContent = function(body) {
  this.content = {
    value: this.encode(body),
    contentType: this.contentType,
    charset: this.charset,
    contentEncoding: this.contentEncoding,
    links: this.encodeLinks(this.links),
    usermeta: this.encodeUsermeta(this.usermeta)
  };
  delete this.usermeta;
  delete this.links;
  return this;
};
Meta.prototype.encodeLinks = function(links) {
  var parsed;
  parsed = [];
  if (links && !Array.isArray(links)) {
    links = [links];
  }
  links.forEach(function(link) {
    return parsed.push(link);
  });
  return parsed;
};
Meta.prototype.encodeUsermeta = function(data) {
  var _ref, key, parsed, value;
  parsed = [];
  _ref = data;
  for (key in _ref) {
    value = _ref[key];
    parsed.push({
      key: key,
      value: value
    });
  }
  return parsed;
};
module.exports = Meta;