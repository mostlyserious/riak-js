var Meta = require('../lib/http-meta'),
  should = require('should'),
  fs = require('fs');

describe('http-meta-tests', function() {
  it('Set Meta Attributes', function(done) {
    var meta = new Meta({ bucket: 'bucket', key: 'key', contentType: 'png', data: 'd32n92390XMIW0' });
    meta.bucket.should.equal('bucket');
    meta.key.should.equal('key');
    should.not.exist(meta.vclock);
    meta.contentType.should.equal('image/png');
    meta.data.toString().should.equal('d32n92390XMIW0');

    done();
  });

  it('Gives back its HTTP path', function(done) {
    var meta = new Meta({ bucket: 'bucket', key: 'key' });
    meta.path.should.equal('/riak/bucket/key');
    meta.resource = 'luwak';
    meta.bucket = '';
    meta.path.should.equal('/luwak/key');

    done();
  });

  it('Parses headers when loaded with a Riak HTTP response', function(done) {
    var riakResponse = {
      httpVersion: '1.1',
      headers: {
        vary: 'Accept-Encoding',
        server: 'MochiWeb/1.1 WebMachine/1.7.1 (participate in the frantic)',
        'x-riak-vclock': 'a85hYGBgzGDKBVIsbLvm1WYwJTLmsTLcjeE5ypcFAA==',
        'x-riak-meta-acl': 'users:r,administrators:f',
        link: '</riak/test>; rel="up", </riak/test/doc%252%24%40>; riaktag="next"',
        'last-modified': 'Wed, 10 Mar 2010 18:11:41 GMT',
        etag: '6dQBm9oYA1mxRSH0e96l5W',
        date: 'Wed, 10 Mar 2010 18:11:52 GMT',
        'content-type': 'text/rtf',
        'content-length': '2946'
      },
      statusCode: 200
    }

    var meta = new Meta({ bucket: 'bucket', key: 'key' });
    meta.loadResponse(riakResponse);

    // assert.deepEqual(meta.usermeta, { acl: 'users:r,administrators:f' }); -- usermeta is not supported
    meta.statusCode.should.equal(200);
    new Date(meta.date).getTime().should.equal(1268244712000);
    new Date(meta.lastMod).getTime().should.equal(1268244701000);
    meta.contentType.should.equal('text/rtf');
    meta.path.should.equal('/riak/bucket/key');

    done();
  });

  it('Custom headers are correctly included and override', function(done) {

    var meta = new Meta({
      links: [
        { bucket: 'test', key: 'doc%2$@', tag: 'next' }
      ],
      headers: {
        Authorization: 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==',
        'content-length': '2687',
        'X-Riak-Meta-fire': 'yes'
      }
    });

    should.not.exist(meta.headers.statusCode);
    meta.headers['content-length'].should.equal('2687');
    meta.headers['X-Riak-Meta-fire'].should.equal('yes');
    // meta.headers['Link'].should.equal('</riak/test/doc%252%24%40>; riaktag="next"'); -- not yet implemented
    meta.headers['Authorization'].should.equal('Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==');
    done();

  });

  it('It returns its location from a POST request', function(done) {
    var riakResponse = {
      headers: {
        location: '/riak/test/bzPygTesROPtGGVUKfyvp2RR49'
      },
      statusCode: 201
    };

    var meta = new Meta();
    meta.loadResponse(riakResponse);

    meta.key.should.equal('bzPygTesROPtGGVUKfyvp2RR49');
    meta.statusCode.should.equal(201);
    done();
  });

  it('It guesses its content type', function(done) {
    var headers = new Meta({ data: { test: true } }).headers;

    headers['content-type'].should.equal('application/json');
    should.not.exist(headers['link']);

    done();
  });

  it('Does not send clientId if there is no vclock', function(done) {
    var headers = new Meta().headers;

    should.not.exist(headers['x-riak-clientId']);

    done();
  });

  it('It returns its full path including query properties', function(done) {
    var meta = new Meta({
      bucket: 'bucket',
      key: 'key',
      r: 1,
      w: 2,
      dw: 2,
      rw: 2,
      keys: true,
      props: false,
      vtag: 'asweetvtag',
      returnbody: true,
      chunked: true
    });

    meta.path.should.equal('/riak/bucket/key?r=1&w=2&dw=2&rw=2&keys=true&props=false&vtag=asweetvtag&returnbody=true&chunked=true');

    done();
  });

  it('Returns an URI-encoded path if used with encodeUri option', function(done) {
    var meta = new Meta({
      bucket: 'spåce bucket',
      key: 'çøµπléx–key',
      encodeUri: true
    });

    meta.path.should.equal('/riak/sp%C3%A5ce%20bucket/%C3%A7%C3%B8%C2%B5%CF%80l%C3%A9x%E2%80%93key');

    done();
  });

  it('Sets a boundary when response is multipart', function(done) {
    var meta = new Meta({
    });

    var multipartResponse = {
      httpVersion: '1.1',
      headers: {
        vary: 'Accept-Encoding',
        server: 'MochiWeb/1.1 WebMachine/1.7.1 (participate in the frantic)',
        'x-riak-vclock': 'a85hYGBgzGDKBVIsbLvm1WYwJTLmsTLcjeE5ypcFAA==',
        'x-riak-meta-acl': 'users:r,administrators:f',
        link: '</riak/test>; rel="up", </riak/test/doc%252%24%40>; riaktag="next"',
        'last-modified': 'Wed, 10 Mar 2010 18:11:41 GMT',
        etag: '6dQBm9oYA1mxRSH0e96l5W',
        date: 'Wed, 10 Mar 2010 18:11:52 GMT',
        'content-type': 'multipart/mixed; boundary=59RSLp9FHlsTnSGjjlVsrs0Aud',
        'content-length': '2946'
      },
      statusCode: 200
    };

    meta.loadResponse(multipartResponse);
    meta.boundary.should.equal('59RSLp9FHlsTnSGjjlVsrs0Aud');

    done();
  });

  it('Parsing the multipart body', function(done) {

    var meta = new Meta({
    });

    var multipartResponse = {
      httpVersion: '1.1',
      headers: {
        vary: 'Accept-Encoding',
        server: 'MochiWeb/1.1 WebMachine/1.7.1 (participate in the frantic)',
        'x-riak-vclock': 'a85hYGBgzGDKBVIsbLvm1WYwJTLmsTLcjeE5ypcFAA==',
        'x-riak-meta-acl': 'users:r,administrators:f',
        link: '</riak/test>; rel="up", </riak/test/doc%252%24%40>; riaktag="next"',
        'last-modified': 'Wed, 10 Mar 2010 18:11:41 GMT',
        etag: '6dQBm9oYA1mxRSH0e96l5W',
        date: 'Wed, 10 Mar 2010 18:11:52 GMT',
        'content-type': 'multipart/mixed; boundary=59RSLp9FHlsTnSGjjlVsrs0Aud',
        'content-length': '2946'
      },
      statusCode: 200
    };

    meta.loadResponse(multipartResponse);
    meta.boundary.should.equal('59RSLp9FHlsTnSGjjlVsrs0Aud');

    var multipartMessage = fs.readFileSync(__dirname + '/fixtures/multipart');
    var parts = meta._parseMultipartMixed(multipartMessage);

    parts.length.should.equal(2);
    parts[0].body.should.equal('{"likes":"lebkuchen"}');
    parts[1].body.should.equal('{"eats":"lebkuchen"}');

    parts[0].headers['content-type'].should.equal('application/json');
    parts[1].headers['content-type'].should.equal('application/json');

    parts[0].headers['etag'].should.equal('4w0Pmt0N1yXnR1ecZiFxPi');
    parts[1].headers['etag'].should.equal('p8gYGbYxc78iCllp9PqkK');

    done();
  });

  it('Parsing more than 2 siblings', function(done) {

    var meta = new Meta({
    });

    var multipartResponse = {
      httpVersion: '1.1',
      headers: {
        vary: 'Accept-Encoding',
        server: 'MochiWeb/1.1 WebMachine/1.7.1 (participate in the frantic)',
        'x-riak-vclock': 'a85hYGBgzGDKBVIsbLvm1WYwJTLmsTLcjeE5ypcFAA==',
        'x-riak-meta-acl': 'users:r,administrators:f',
        link: '</riak/test>; rel="up", </riak/test/doc%252%24%40>; riaktag="next"',
        'last-modified': 'Wed, 10 Mar 2010 18:11:41 GMT',
        etag: '6dQBm9oYA1mxRSH0e96l5W',
        date: 'Wed, 10 Mar 2010 18:11:52 GMT',
        'content-type': 'multipart/mixed; boundary=59RSLp9FHlsTnSGjjlVsrs0Aud',
        'content-length': '2946'
      },
      statusCode: 200
    };

    meta.loadResponse(multipartResponse);
    meta.boundary.should.equal('59RSLp9FHlsTnSGjjlVsrs0Aud');

    var multipartMessage = fs.readFileSync(__dirname + '/fixtures/big_multipart');
    var parts = meta._parseMultipartMixed(multipartMessage);

    parts.length.should.equal(8);

    done();
  });
});

