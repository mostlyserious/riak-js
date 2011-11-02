var EventEmitter = require('events').EventEmitter,
  util = require('util');

var Client = function Client(options) {
  EventEmitter.call(this);
}

util.inherits(Client, EventEmitter);

module.exports = Client;