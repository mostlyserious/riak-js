var ProtocolBuffersClient = require('../../lib/protocol-buffers-client'),
    HttpClient = require('../../lib/http-client'),
    should = require('should'),
    helpers = require('./../test_helper');

var db, http, bucket;

describe('protocol-buffers-search-client', function() {
  before(function(done) {
    db = new ProtocolBuffersClient();
    http = new HttpClient();
    bucket = 'pb-search';
    http.saveBucket(bucket, {search: true}, function(error) {
      db.save(bucket, 'roidrage', {name: "Mathias Meyer"}, {content_type: "application/json"}, function(error, data) {
        done();
      });
    });
  });

  after(function(done) {
    helpers.cleanupBucket(bucket, function() {
      db.end();
      done();
    });
  });


  it('Finds documents via search', function(done) {
    db.search.find('pb-search', 'name:Mathias*', function(error, data) {
      data.docs[0].fields.should.include({name: 'Mathias Meyer'});
      data.docs[0].fields.should.include({id: 'roidrage'});
      done();
    });
  });
});
