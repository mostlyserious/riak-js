var Meta = require('../lib/meta'),
  should = require('should');

describe('meta-tests', function() {
  it('Sets its attributes', function(done) {
    var meta = new Meta({
      bucket: 'bucket',
      key: 'key',
      contentType: 'png',
      data: 'd32n92390XMIW0',
      host: '192.168.1.2',
      myown: 'field' });

    meta.bucket.should.equal('bucket');
    meta.key.should.equal('key');
    should.not.exist(meta.vclock);
    meta.contentType.should.equal('image/png');
    meta.data.toString().should.equal('d32n92390XMIW0');

    done();
  });

  it('Properly falls back to defaults', function(done) {

    var meta = new Meta({
      bucket: 'bucket',
      key: 'key',
      contentType: 'png',
      data: 'd32n92390XMIW0',
      host: '192.168.1.2',
      myown: 'field' });

    meta.links.should.eql(Meta.defaults.links);
    meta.resource.should.equal(Meta.defaults.resource);
    meta.clientId.should.equal(Meta.defaults.clientId);
    meta.host.should.equal('192.168.1.2');
    done();
  });

  it('Properly falls back to defaults', function(done) {

    var meta = new Meta({
      bucket: 'bucket',
      key: 'key',
      contentType: 'png',
      data: 'd32n92390XMIW0',
      host: '192.168.1.2',
      myown: 'field' });

    should.not.exist(meta.myown);

    done();
  });

  it('Is able to detect the content type', function(done) {
    var meta = new Meta({ data: { a: 1 } });
    meta.contentType.should.equal('application/json');

    done();
  });

  it('Is able to detect the content type (XML)', function(done) {
    var meta = new Meta({ contentType: 'xml', data: '<a>b</a>' });
    meta.contentType.should.equal('text/xml');

    done();
  });

  it('Manual content type setting has priority over detection', function(done) {
    var meta = new Meta();

    meta.loadData('some text');
    meta.contentType.should.equal('text/plain');

    done();
  });

  it('Can be passed multiple option objects, and it mixes in correctly', function(done) {
    var meta = new Meta({
        bucket: '?',
        stream: true,
        key: 'key' },
      { bucket: '_',
        callback: function() { console.log('test') }
      }, { bucket: 'bucket' });

    meta.bucket.should.equal('bucket');
    meta.key.should.equal('key');
    should.exist(meta.stream);
    meta.callback.toString().should.equal('function () { console.log(\'test\') }');

    done();
  });

  it('A Meta fed with another Meta results in identity', function(done) {
    var meta = new Meta({ bucket: 'bucket', key: 'key' }),
      meta2 = new Meta(meta);

    meta.should.eql(meta2);
    done();
  });

});

// TODO What are these?

//       keyless.addLink { bucket: 'bucket', key: 'test' }
//       keyless.addLink { bucket: 'bucket', key: 'test2', tag: '_' }
//       keyless.addLink { bucket: 'bucket', key: 'test', tag: 'tag' }
//       
//       # dupes
//       keyless.addLink { bucket: 'bucket', key: 'test' }
//       keyless.addLink { bucket: 'bucket', key: 'test', tag: 'tag' }
//       keyless.addLink { bucket: 'bucket', key: 'test2', tag: '_' }
//       keyless.addLink { bucket: 'bucket', key: 'test2' } # no tag or '_' are equivalent
//       
//     'duplicate links are ignored': (keyless) ->
//       assert.deepEqual keyless.links, [
//         { bucket: 'bucket', key: 'test' }
//         { bucket: 'bucket', key: 'test2', tag: '_' }
//         { bucket: 'bucket', key: 'test', tag: 'tag' }
//       ]
//     
//     'links can be removed': (keyless) ->
//       keyless.removeLink { bucket: 'bucket', key: 'test' }
//       assert.equal keyless.links.length, 2
//       keyless.removeLink { bucket: 'bucket', key: 'test', tag: 'tag' }
//       assert.equal keyless.links.length, 1
//       keyless.removeLink { bucket: 'bucket', key: 'test2' } # should treat tag '_' as non-existent
//       assert.equal keyless.links.length, 0