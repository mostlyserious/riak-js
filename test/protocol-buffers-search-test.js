var ProtocolBuffersClient = require('../lib/protocol-buffers-client'),
    HttpClient = require('../lib/http-client'),
    should = require('should');

var db, http;

describe('protocol-buffers-search-client', function() {
  beforeEach(function(done) {
    db = new ProtocolBuffersClient();    
    http = new HttpClient();
    http.saveBucket('pb-search', {search: true}, function(error) {
      db.save('pb-search', 'roidrage', {name: "Mathias Meyer"}, {content_type: "application/json"}, function(error, data) {
        done();
      });
    })
  });

  afterEach(function(done) {
    db.end();
    done();
  });

  it('Finds documents via search', function(done) {
    db.search.find('pb-search', 'name:Mathias*', function(error, data) {
      data.docs[0].fields.should.include({name: 'Mathias Meyer'})
      data.docs[0].fields.should.include({id: 'roidrage'})
      done();
    });
  });
});
