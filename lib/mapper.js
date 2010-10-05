var Mapper;
var __slice = Array.prototype.slice, __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
Mapper = function(_arg, _arg2) {
  this.inputs = _arg2;
  this.riak = _arg;
  this.phases = [];
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
Mapper.prototype.run = function() {
  var _ref, callback, options;
  options = __slice.call(arguments, 0);
  _ref = this.riak.ensure(options);
  options = _ref[0];
  callback = _ref[1];
  return this.riak.runJob(this.job(this.inputs, options), callback);
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
  if (!Array.isArray(phase)) {
    phase = [phase];
  }
  phase.forEach(__bind(function(p) {
    var _ref, temp;
    temp = {};
    if (p) {
      temp[type] = (function() {
        switch (typeof p) {
          case 'function':
            return {
              source: p.toString(),
              arg: args
            };
          case 'string':
            return {
              name: p,
              arg: args
            };
          case 'object':
            if (typeof (_ref = p.source) !== "undefined" && _ref !== null) {
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