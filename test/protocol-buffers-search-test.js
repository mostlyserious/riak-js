var ProtocolBuffersClient = require('../lib/protocol-buffers-client'),
    should = require('should');

var db;

describe('protocol-buffers-search-client', function() {
  beforeEach(function(done) {
    db = new ProtocolBuffersClient();    
    done();
  });

  afterEach(function(done) {
    db.end();
    done();
  });

  it('Finds documents via search', function(done) {
    db.search.find('pb-users', 'name:Mathias*', {}, function(data) {
      done();
    });
  });
});
