var ProtocolBuffersClient = require('../lib/protocol-buffers-client');

module.exports = function(options) {
  if (!options) {
    options = {};
  }
  if (process.env.PB_PORT) {
    options.port = process.env.PB_PORT;
  }
  return new ProtocolBuffersClient(options);
};
