/**
 * Module dependencies
 */
var utils = require('./utils')

/**
 * @api private
 */
function Mapper(phases, riak) {
  this.phases = phases ;
  this.riak = riak;
}

/**
 * Add one or more *map* phases to the Map/Reduce job
 *
 * @param {Object} One (function, string, or object containing `source`, `name`, `args`, etc) or more phases (each one contained in an Array)
 * @return {Mapper} To be able to chain until `#run()` is called
 * @api public
 */
Mapper.prototype.map = function(phase, args) {
  this.addPhases(utils.makePhases("map", phase, args))
  return this;
}

/**
 * Add one or more *reduce* phases to the Map/Reduce job
 *
 * @param {Object} One (function, string, or object containing `source`, `name`, `args`, etc) or more phases (each one contained in an Array)
 * @return {Mapper} To be able to chain until `#run()` is called
 * @api public
 */
Mapper.prototype.reduce = function(phase, args) {
  this.addPhases(utils.makePhases("reduce", phase, args))
  return this;
}

/**
 * Add one or more *link* phases to the Map/Reduce job
 *
 * @param {Object} One (function, string, or object containing `source`, `name`, `args`, etc) or more phases (each one contained in an Array)
 * @return {Mapper} To be able to chain until `#run()` is called
 * @api public
 */
Mapper.prototype.link = function(phase) {
  this.addPhases(utils.makePhases("link", phase))
  return this;
}

/**
 * Run the Map/Reduce job
 *
 * @param {Array} for a list of `[bucket, key]`, or {String} for a bucket name (*warning*: it has to list the bucket's keys)
 * @return {Function} A function that takes a callback as its only input
 * @api public
 */
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

/**
 * @api private
 */
Mapper.prototype.addPhases = function(phases) {
  var self = this;
  phases.forEach(function(phase) {
    self.phases.push(phase);
  })
}

// exports

module.exports = Mapper