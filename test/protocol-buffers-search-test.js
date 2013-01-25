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
      console.log(data.docs[0].fields)
      data.docs[0].fields[0].should.include({key: 'id'});
      data.docs[0].fields[0].should.include({value: 'roidrage'});
      data.docs[0].fields[1].should.include({key: 'name'});
      data.docs[0].fields[1].should.include({value: 'Mathias Meyer'});
      done();
    });
  });
});
