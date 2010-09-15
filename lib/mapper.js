(function() {
  var Mapper, utils;
  var __slice = Array.prototype.slice, __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
  utils = require('./utils');
  Mapper = function(_a, type, phase, args) {
    this.riak = _a;
    this.phases = [];
    if ((typeof type !== "undefined" && type !== null) && (typeof phase !== "undefined" && phase !== null)) {
      this.makePhases(type, phase, args);
    }
    return this;
  };
  Mapper.prototype.map = function(phase, args) {
    return this.makePhases("map", phase, args);
  };
  Mapper.prototype.reduce = function(phase, args) {
    return this.makePhases("reduce", phase, args);
  };
  Mapper.prototype.link = function(phase) {
    return this.makePhases("link", phase);
  };
  Mapper.prototype.run = function(inputs) {
    var options;
    var _a = arguments.length, _b = _a >= 3, callback = arguments[_b ? _a - 1 : 1];
    options = __slice.call(arguments, 1, _a - 1);
    options = options[0];
    return this.riak.runJob(this.job(inputs, options), callback);
  };
  Mapper.prototype.job = function(inputs, options) {
    options || (options = {});
    options.data = {
      inputs: inputs,
      query: this.phases
    };
    return options;
  };
  Mapper.prototype.makePhases = function(type, phase, args) {
    if (!utils.isArray(phase)) {
      phase = [phase];
    }
    phase.forEach(__bind(function(p) {
      var _a, _b, temp;
      temp = {};
      if (p) {
        temp[type] = (function() {
          if ((_a = typeof p) === 'function') {
            return {
              source: p.toString(),
              arg: args
            };
          } else if (_a === 'string') {
            return {
              name: p,
              arg: args
            };
          } else if (_a === 'object') {
            if (typeof (_b = p.source) !== "undefined" && _b !== null) {
              p.source = p.source.toString();
            }
            return p;
          }
        })();
        temp[type].language || (temp[type].language = Mapper.defaults.language);
        return this.phases.push(temp);
      }
    }, this));
    return this;
  };
  Mapper.defaults = {
    language: 'javascript'
  };
  module.exports = Mapper;
})();
