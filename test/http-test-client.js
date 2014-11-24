var HttpClient = require('../lib/http-client');

module.exports = function(options) {
  if (!options) {
    options = {};
  }
  if (process.env.HTTP_PORT){
    options.port = process.env.HTTP_PORT;
  }
  if (options.pool) {
    var servers = [];
    options.pool.servers.forEach(function(entry){
      var split = entry.split(':');
      servers.push(split[0] + ':' + (options.port || split[1]));
    });
    options.pool.servers = servers;
  }
  return new HttpClient(options);
};
