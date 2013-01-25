var Meta = require('../lib/protocol-buffers-meta'),
  should = require('should');

var meta, response;

describe('protocol-buffers-meta-tests', function() {
  before(function(done) {
    meta = new Meta({bucket: 'bucket', key: 'key', contentType: 'png', data: 'asdfdsfaslj'});
    done();
  });

  it('Loads the response', function(done) {
    var response = {
      content: [{
        value: 'Joe Example',
        vtag: '4SDUsFbniqHEYsPO6kbEwk',
        last_mod: 1354021798,
        last_mod_usecs: 692437,
        content_type: 'text/plain'
      }],
      vclock: "4SDUsFbniqHEYsPO6kbEwkklajsf4SDUsFbniqHEYsPO6kbEwk"
    };

    meta.loadResponse(response);

    meta.contentType.should.equal('text/plain');
    new Date(meta.lastMod).getTime().should.equal(1354021798);
    should.exist(meta.vclock);
    done();
  });

  it('Loads response with serialized data', function(done) {
    response = {
      content: [{
        value: '{"name": "Joe Example"}',
        vtag: '4SDUsFbniqHEYsPO6kbEwk',
        last_mod: 1354021798,
        last_mod_usecs: 692437,
        content_type: 'application/json'
      }]
    };
    done();
  });
});



