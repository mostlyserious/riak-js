var HttpClient = require('../lib/http-client'),
  HttpMeta = require('../lib/http-meta'),
  should = require('should');

var db;

describe('http-client-pool', function () {
  before(function(done) {
    db = new HttpClient({ pool: {
      servers: [
        'localhost:8098',
        'localhost:8098'
      ],
      options: {}
    }});
    done();
  });

  it('Creates an object', function(done) {
    db.save('languages', 'erlang', {type: 'functional'}, function(err) {
      db.get('languages', 'erlang', function(err, data) {
        should.not.exist(err);
        data.type.should.equal('functional');
        done();
      });
    });
  });

  it('Fetches the streamed object', function(done) {
    db.get('languages', 'erlang', {stream: true}, function(err, response, meta) {
      should.not.exist(err);
      response.on('data', function(data) {
        data = JSON.parse(String(data));
        data.type.should.equal('functional');
        done();
      });
    });
  })
})

