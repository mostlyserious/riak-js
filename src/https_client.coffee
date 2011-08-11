https = require 'https'
HttpClient = require './http_client'

{ EventEmitter } = require 'events'

class HttpsClient extends HttpClient
  constructor: (options) ->
    options.http = options.http || https
    super options

module.exports = HttpsClient
