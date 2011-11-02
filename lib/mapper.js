var Mapper = function(inputs, client) {  
  this.phases = [];
  this.inputs = inputs;
  this.client = client;
}

//
// Add one or more *map* phases to the Map/Reduce job
//
// @param {Object} One (function, string, or object containing `source`, `name`, `args`, etc) or more phases (each one contained in an Array)
// @return {Mapper} To be able to chain until `//run()` is called
// @api public
//
Mapper.prototype.map = function(phase, args) {
  var phases = makePhases('map', phase, args);
  this.phases = this.phases.concat(phases);
  return this;
}

//
// Add one or more *reduce* phases to the Map/Reduce job
//
// @param {Object} One (function, string, or object containing `source`, `name`, `args`, etc) or more phases (each one contained in an Array)
// @return {Mapper} To be able to chain until `//run()` is called
// @api public
//
Mapper.prototype.reduce = function(phase, args) {
  var phases = makePhases('reduce', phase, args);
  this.phases = this.phases.concat(phases);
  return this;
}

//
// Add one or more *link* phases to the Map/Reduce job
//
// @param {Object} One (function, string, or object containing `source`, `name`, `args`, etc) or more phases (each one contained in an Array)
// @return {Mapper} To be able to chain until `//run()` is called
// @api public
//
Mapper.prototype.link = function(phase) {
  var phases = makePhases('link', phase);
  this.phases = this.phases.concat(phases);
  return this;
}

// Run the Map/Reduce job
//
// @param {Array} for a list of `[bucket, key]`, or {String} for a bucket name (*warning*: it has to list the bucket's keys)
// @return {Function} A function that takes a callback as its only input
// @api public
//
Mapper.prototype.run = function(options, callback) {
  var job = {
    data: {
      inputs: this.inputs,
      query: this.phases
    }
  }
  if (options.timeout) job.data.timeout = options.timeout;
  this.client._run(job, options, callback);
}

// helpers

var makePhases = function(type, phase, args) {
  
  if (!Array.isArray(phase)) phase = [phase];
  
  return phase
    .filter(function(p) { return !!p })
    .map(function(p) {
      var temp = {};
      if (p) {
        switch (typeof p) {
          case 'function': temp[type] = { source: p.toString(), arg: args }; break;
          case 'string': temp[type] = { name: p, arg: args }; break;
          case 'object': if (p.source) p.source = p.source.toString(); temp[type] = p; break;
        }
      
        temp[type].language = temp[type].language || Mapper.defaults.language;
        return temp;
      }
    });
  
}

Mapper.defaults = {
  language: 'javascript'
}

// exports

module.exports = Mapper;