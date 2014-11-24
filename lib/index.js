/**
 * Module dependencies.
 */
var HttpClient = require('./http-client'),
    ProtocolBuffersClient = require('./protocol-buffers-client');

module.exports = getClient;

function getClient(options) {
  if (options == undefined) options = {};

  if (options.api == undefined) {
    options.api = 'http';
  }

  return getClient[options.api](options);
}

getClient.protobuf = function(options) {
  return new ProtocolBuffersClient(options);
};

getClient.http = function(options) {
  return new HttpClient(options);
};
