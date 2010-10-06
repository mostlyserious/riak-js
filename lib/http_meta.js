var CoreMeta, Link, Meta, Utils;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
CoreMeta = require('./meta');
Utils = require('./utils');
Meta = function() {
  return CoreMeta.apply(this, arguments);
};
__extends(Meta, CoreMeta);
Meta.prototype.requestMappings = {
  accept: 'accept',
  host: 'host',
  clientId: 'x-riak-clientid',
  vclock: 'x-riak-vclock',
  lastMod: 'If-Modified-Since',
  etag: 'If-None-Match',
  links: 'link',
  contentType: 'content-type'
};
Meta.prototype.responseMappings = {
  'content-type': 'contentType',
  'x-riak-vclock': 'vclock',
  'last-modified': 'lastMod',
  'etag': 'etag',
  'link': 'links'
};
Meta.prototype.load = function(options) {
  var queryProps, queryString;
  Meta.__super__.load.call(this, options, Meta.riakProperties.concat(Meta.queryProperties));
  queryProps = {};
  Meta.queryProperties.forEach(__bind(function(prop) {
    var _ref;
    if (typeof (_ref = this[prop]) !== "undefined" && _ref !== null) {
      return (queryProps[prop] = this[prop]);
    }
  }, this));
  queryString = this.stringifyQuery(queryProps);
  return (this.path = ("/" + (this.raw) + "/" + (this.bucket) + "/" + (this.key || '') + (queryString ? '?' + queryString : '')));
};
Meta.prototype.loadResponse = function(response) {
  var _ref, headers, k, u, v;
  headers = response.headers;
  this.statusCode = response.statusCode;
  _ref = this.mappings;
  for (k in _ref) {
    if (!__hasProp.call(_ref, k)) continue;
    v = _ref[k];
    if (v === 'link') {
      this[k] = this.stringToLinks(headers[v]);
    } else {
      this[k] = headers[v];
    }
  }
  _ref = headers;
  for (k in _ref) {
    if (!__hasProp.call(_ref, k)) continue;
    v = _ref[k];
    u = k.match(/^X-Riak-Meta-(.*)/i);
    if (u) {
      this.usermeta[u[1]] = v;
    }
  }
  return this;
};
Meta.prototype.toHeaders = function() {
  var _ref, headers, k, v;
  headers = {
    Accept: "multipart/mixed, application/json;q=0.7, */*;q=0.5"
  };
  _ref = this.mappings;
  for (k in _ref) {
    if (!__hasProp.call(_ref, k)) continue;
    v = _ref[k];
    if (k === 'links') {
      headers[v] = this.linksToString();
    } else {
      if (this[k]) {
        headers[v] = this[k];
      }
    }
  }
  _ref = this.usermeta;
  for (k in _ref) {
    if (!__hasProp.call(_ref, k)) continue;
    v = _ref[k];
    headers[("X-Riak-Meta-" + (k))] = v;
  }
  return headers;
};
Meta.prototype.stringToLinks = function(links) {
  var result;
  result = [];
  if (links) {
    links.split(',').forEach(function(link) {
      var _i, _ref, captures, i;
      captures = link.trim().match(/^<\/(.*)\/(.*)\/(.*)>;\sriaktag="(.*)"$/);
      if (captures) {
        _ref = captures;
        for (i in _ref) {
          if (!__hasProp.call(_ref, i)) continue;
          _i = _ref[i];
          captures[i] = decodeURIComponent(captures[i]);
        }
        return result.push(new Link({
          bucket: captures[2],
          key: captures[3],
          tag: captures[4]
        }));
      }
    });
  }
  return result;
};
Meta.prototype.linksToString = function() {
  return this.links.map(__bind(function(link) {
    return "</" + (this.raw) + "/" + (link.bucket) + "/" + (link.key) + ">; riaktag=\"" + (link.tag || "_") + "\"";
  }, this)).join(", ");
};
Meta.queryProperties = ['r', 'w', 'dw', 'rw', 'keys', 'props', 'vtag', 'returnbody', 'chunked'];
Meta.riakProperties = ['statusCode', 'host'];
Link = function(options) {
  this.bucket = options.bucket;
  this.key = options.key;
  this.tag = options.tag;
  return this;
};
module.exports = Meta;