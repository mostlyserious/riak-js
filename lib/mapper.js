var utils = require('./utils')

function Mapper(phases, riak) {
  this.phases = phases ;
  this.riak = riak;
}

Mapper.prototype.map = function(phase, args) {
  this.addPhases(utils.makePhases("map", phase, args))
  return this;
}

Mapper.prototype.reduce = function(phase, args) {
  this.addPhases(utils.makePhases("reduce", phase, args))
  return this;
}

Mapper.prototype.link = function(phase) {
  this.addPhases(utils.makePhases("link", phase))
  return this;
}

Mapper.prototype.run = function(inputs, options) {
  options = utils.ensure(options);
  options.interface = 'mapred';
  options.method = 'POST';

  this.phases.forEach(function(phase) {
    for (p in phase) { // map, reduce or link
      if (phase[p].language === undefined) {
        phase[p].language = 'javascript';
      };
    }
  })
  
  options.data = {
    inputs: inputs,
    query: this.phases
  }

  return this.riak.execute('', options);
}

Mapper.prototype.addPhases = function(phases) {
  var self = this;
  phases.forEach(function(phase) {
    self.phases.push(phase);
  })
}

// exports

module.exports = Mapper