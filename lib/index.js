var HttpClient = require('./http-client');

module.exports = {
  getClient: function(options) {
    return new HttpClient(options);
  }
}