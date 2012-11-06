/**
 * Module dependencies.
 */
var EventEmitter = require('events').EventEmitter,
  util = require('util');

/**
 * Abstract `Client`, meant to be initialized further down the prototype chain.
 *
 * @param {Object} options
 * @api private
 */
var Client = function Client(options) {
  EventEmitter.call(this);
}

util.inherits(Client, EventEmitter);

Client.prototype.registerListener = function(listener) {
  for (var i in listener) {
    this.on(i, listener[i]);
  }
}

module.exports = Client;
