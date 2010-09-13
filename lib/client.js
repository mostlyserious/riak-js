(function() {
  var Client;
  Client = function(options) {
    this.options = options || {};
    return this;
  };
  Client.prototype.error = function(response) {
    return response instanceof Error;
  };
  module.exports = Client;
})();
