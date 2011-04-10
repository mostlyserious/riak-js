#
# @api private
#
class Mapper
  constructor: (@riak, @inputs) ->
    @phases = []

  #
  # Add one or more *map* phases to the Map/Reduce job
  #
  # @param {Object} One (function, string, or object containing `source`, `name`, `args`, etc) or more phases (each one contained in an Array)
  # @return {Mapper} To be able to chain until `#run()` is called
  # @api public
  #
  map: (phase, args) ->
    @makePhases "map", phase, args

  #
  # Add one or more *reduce* phases to the Map/Reduce job
  #
  # @param {Object} One (function, string, or object containing `source`, `name`, `args`, etc) or more phases (each one contained in an Array)
  # @return {Mapper} To be able to chain until `#run()` is called
  # @api public
  #
  reduce: (phase, args) ->
    @makePhases "reduce", phase, args

  #
  # Add one or more *link* phases to the Map/Reduce job
  #
  # @param {Object} One (function, string, or object containing `source`, `name`, `args`, etc) or more phases (each one contained in an Array)
  # @return {Mapper} To be able to chain until `#run()` is called
  # @api public
  #
  link: (phase) ->
    @makePhases "link", phase

  #
  # Run the Map/Reduce job
  #
  # @param {Array} for a list of `[bucket, key]`, or {String} for a bucket name (*warning*: it has to list the bucket's keys)
  # @return {Function} A function that takes a callback as its only input
  # @api public
  #
  run: (options...) ->
    [options, callback] = @riak.ensure options
    @riak.runJob @job(@inputs, options), callback

  #
  # @api private
  #

  job: (inputs, options = {}) ->
    options.data =
      inputs: inputs
      query:  @phases
    options.data.timeout = options.timeout if options.timeout?
    options

  makePhases: (type, phase, args) ->
    phase = [phase] if not Array.isArray phase
    phase.forEach (p) =>
      temp = {}
      if p
        temp[type] = switch typeof p
          when 'function' then {source: p.toString(), arg: args}
          when 'string'   then {name: p, arg: args}
          when 'object'
            p.source = p.source.toString() if p.source?
            p
        temp[type].language ||= Mapper.defaults.language
        @phases.push temp
    this

Mapper.defaults =
  language:  'javascript'

# exports

module.exports = Mapper
