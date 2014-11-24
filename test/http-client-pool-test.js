var HttpClient = require('./http-test-client'),
  HttpMeta = require('../lib/http-meta'),
  should = require('should'),
  helpers = require('./test_helper.js');

var db, bucket;

describe('http-client-pool', function () {
  before(function(done) {
    bucket = 'languages';
    db = new HttpClient({ pool: {
      servers: [
        'localhost:8098',
        'localhost:8098'
      ],
      options: {}
    }});
    done();
  });

  after(function (done) {
    helpers.cleanupBucket(bucket, done);
  });

  it('Creates an object', function(done) {
    db.save(bucket, 'erlang', {type: 'functional'}, function(err) {
      db.get(bucket, 'erlang', function(err, data) {
        should.not.exist(err);
        data.type.should.equal('functional');
        done();
      });
    });
  });

  it('Fetches the streamed object', function(done) {
    db.get(bucket, 'erlang', {stream: true}, function(err, response, meta) {
      should.not.exist(err);
      response.on('data', function(data) {
        data = JSON.parse(String(data));
        data.type.should.equal('functional');
        done();
      });
    });
  });
});

