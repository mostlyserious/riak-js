/**
 * Module dependencies
 */
var utils = require('./utils')

/**
 * Constructor
 *
 * @api private
 */
function Meta(headers, interface, key, statusCode) {
  this.headers = headers;
  this.key = key;
  this.statusCode = statusCode;
  this.type = headers['content-type'];
  this.interface = interface;
}

/**
 * Removes a link from the current list of links
 *
 * @param {Object} Link, such as `{bucket: 'bucket', key: 'mykey'}`
 * @api public
 */
Meta.prototype.removeLink = function(link) {
  this.headers.link = this.makeLinks(this.links.filter(function(n) {
    return n.bucket !== link.bucket || n.key !== link.key
  }))
}

/**
 * Link getter
 *
 * @return {Array} All the links in the current list of links
 * @api public
 */
Meta.prototype.__defineGetter__('links', function() {
  return utils.stringToLinks(this.headers.link)
})

/**
 * Link setter (one, or more in an Array)
 *
 * @param {Object} {Array} Link(s)
 * @api public
 */
Meta.prototype.__defineSetter__('links', function(links) {
  if (!utils.isArray(links)) links = [links]
  this.headers.link = (this.headers.link ? this.headers.link + ", " : "") + this.makeLinks(links)
})

/**
 * @api private
 */
Meta.prototype.makeLinks = function(links) {
  var self = this;
  return links.map(function(link) {
    link.tag = link.tag || "_";
    return '</' + self.interface + '/' + link.bucket + '/' + link.key + '>; riaktag="' + link.tag + '"';
  }).join(", ");
}

module.exports = Meta