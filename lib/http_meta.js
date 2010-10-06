var CoreMeta, Meta, Utils, linkUtils;
var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  }, __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
CoreMeta = require('./meta');
Utils = require('./utils');
Meta = function() {
  return CoreMeta.apply(this, arguments);
};
__extends(Meta, CoreMeta);
Meta.prototype.load = function(options) {
  return Meta.__super__.load.call(this, options, Meta.riakProperties.concat(Meta.queryProperties), Meta.defaults);
};
Meta.prototype.responseMappings = {
  'content-type': 'contentType',
  'x-riak-vclock': 'vclock',
  'last-modified': 'lastMod',
  etag: 'etag'
};
Meta.prototype.loadResponse = function(response) {
  var $0, _ref, headers, k, u, v;
  headers = response.headers;
  _ref = this.responseMappings;
  for (v in _ref) {
    if (!__hasProp.call(_ref, v)) continue;
    k = _ref[v];
    this[k] = headers[v];
  }
  this.statusCode = response.statusCode;
  _ref = headers;
  for (k in _ref) {
    if (!__hasProp.call(_ref, k)) continue;
    v = _ref[k];
    u = k.match(/^X-Riak-Meta-(.*)/i);
    if (u) {
      this.usermeta[u[1]] = v;
    }
  }
  if (headers.link) {
    this.links = linkUtils.stringToLinks(headers.link);
  }
  if (headers.location) {
    _ref = headers.location.match(/\/([^\/]+)\/([^\/]+)\/([^\/]+)/);
    $0 = _ref[0];
    this.raw = _ref[1];
    this.bucket = _ref[2];
    this.key = _ref[3];
  }
  return this;
};
Meta.prototype.requestMappings = {
  accept: 'Accept',
  host: 'Host',
  clientId: 'X-Riak-ClientId',
  vclock: 'X-Riak-Vclock'
};
Meta.prototype.toHeaders = function() {
  var _ref, headers, k, v;
  headers = {};
  _ref = this.requestMappings;
  for (k in _ref) {
    if (!__hasProp.call(_ref, k)) continue;
    v = _ref[k];
    if (this[k]) {
      headers[v] = this[k];
    }
  }
  _ref = this.usermeta;
  for (k in _ref) {
    if (!__hasProp.call(_ref, k)) continue;
    v = _ref[k];
    headers[("X-Riak-Meta-" + (k))] = String(v);
  }
  if (this.links.length > 0) {
    headers['Link'] = linkUtils.linksToString(this.links, this.raw);
  }
  if (typeof (_ref = this.data) !== "undefined" && _ref !== null) {
    headers['Content-Type'] = this.contentType;
  }
  return headers;
};
Meta.prototype.__defineGetter__('path', function() {
  var queryString;
  queryString = this.stringifyQuery(this.queryProps);
  return "/" + (this.raw) + "/" + (this.bucket || '') + "/" + (this.key || '') + (queryString ? '?' + queryString : '');
});
Meta.prototype.__defineGetter__('queryProps', function() {
  var queryProps;
  queryProps = {};
  Meta.queryProperties.forEach(__bind(function(prop) {
    var _ref;
    if (typeof (_ref = this[prop]) !== "undefined" && _ref !== null) {
      return (queryProps[prop] = this[prop]);
    }
  }, this));
  return queryProps;
});
Meta.defaults = {
  host: 'localhost',
  accept: 'multipart/mixed, application/json;q=0.7, */*;q=0.5'
};
Meta.queryProperties = ['r', 'w', 'dw', 'rw', 'keys', 'props', 'vtag', 'returnbody', 'chunked'];
Meta.riakProperties = ['statusCode', 'host'];
module.exports = Meta;
linkUtils = {
  stringToLinks: function(links) {
    var result;
    result = [];
    if (links) {
      links.split(',').forEach(function(link) {
        var _i, _ref, captures, i;
        captures = link.trim().match(/^<\/([^\/]+)\/([^\/]+)\/([^\/]+)>;\sriaktag="(.+)"$/);
        if (captures) {
          _ref = captures;
          for (i in _ref) {
            if (!__hasProp.call(_ref, i)) continue;
            _i = _ref[i];
            captures[i] = decodeURIComponent(captures[i]);
          }
          return result.push({
            bucket: captures[2],
            key: captures[3],
            tag: captures[4]
          });
        }
      });
    }
    return result;
  },
  linksToString: function(links, raw) {
    links = Array.isArray(links) ? links : [links];
    return links.map(__bind(function(link) {
      return "</" + (raw) + "/" + (link.bucket) + "/" + (link.key) + ">; riaktag=\"" + (link.tag || "_") + "\"";
    }, this)).join(", ");
  }
};