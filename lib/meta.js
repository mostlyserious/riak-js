var utils = require('./utils')

function Meta(headers, interface, key, statusCode) {
  this.headers = headers;
  this.key = key;
  this.statusCode = statusCode;
  this.type = headers['content-type'];
  this.interface = interface;
}

Meta.prototype.addLinks = function(links) {
  if (!utils.isArray(links)) links = [links]
  this.headers.link = (this.headers.link ? this.headers.link + ", " : "") + this.makeLinks(links)
}

Meta.prototype.removeLink = function(link) {
  this.headers.link = this.makeLinks(this.links.filter(function(n) {
    return n.bucket !== link.bucket || n.key !== link.key
  }))
}

Meta.prototype.__defineGetter__('links', function() {
  return utils.stringToLinks(this.headers.link)
})

Meta.prototype.makeLinks = function(links) {
  var self = this;
  return links.map(function(link) {
    link.tag = link.tag || "_";
    return '</' + self.interface + '/' + link.bucket + '/' + link.key + '>; riaktag="' + link.tag + '"';
  }).join(", ");
}

module.exports = Meta