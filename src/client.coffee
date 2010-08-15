class Client
  constructor: (options) ->
    @options = options || {}

  error: (response) ->
    response instanceof Error

module.exports = Client