var HttpClient = require('../lib/http-client'),
  fs = require('fs'),
  should = require('should');

var db, events = [], listener,
  filename = __dirname + '/fixtures/cat.jpg',
  filename2 = __dirname + '/fixtures/cat2.jpg',
  filename3 = __dirname + '/fixtures/cat3.jpg',
  image;

//describe('http-client-luwak-tests', function() {
//  before(function(done) {
//    db = new HttpClient({ port: 8098 });
//
//    image = fs.readFileSync(filename);
//
//    // Ensure unit tests don't collide with pre-existing buckets
//    bucketName = 'users-riak-js-tests';
//
//    done();
//  });
//
//  it('Save a file from a buffer', function(done) {
//    db.saveFile('cat2', image,
//      { contentType: 'image/jpeg' },
//      function(err, data, meta) {
//        should.not.exist(err);
//        should.not.exist(data);
//        should.exist(meta);
//        meta.key.should.equal('cat2');
//        meta.statusCode.should.equal(204);
//
//        // race condition - wait for riak
//        setTimeout(function() {
//          db.getFile('cat2', function(data) {
//            data.should.be.an.instanceof(Buffer);
//
//            // TODO compare data to image
//            fs.writeFileSync(filename2, data);
//
//            done();
//          });
//        }, 500);
//      });
//  });
//
//  it('Remove a file', function(done) {
//    db.removeFile('cat2', function(data) {
//      // TODO what are we supposed to be checking here?
//      done();
//    });
//  });
//
//  it('Save a file from a stream', function(done) {
//    db.saveFile('cat3',
//      fs.createReadStream(filename),
//      { contentType: 'image/jpeg' },
//      function(err, data, meta) {
//        should.not.exist(err);
//        should.not.exist(data);
//        should.exist(meta);
//        meta.statusCode.should.equal(204);
//
//        // race condition - wait for riak
//        setTimeout(function() {
//          db.getFile('cat3', { stream: true }, function(stream) {
//
//            should.exist(stream);
//            var out = fs.createWriteStream(filename3);
//            stream.pipe(out);
//
//            out.on('close', function() {
//              done();
//            });
//          });
//        }, 500);
//      });
//  });
//
//  // TODO test luwak with returnbody=true
//
//  it('Remove the file stream', function(done) {
//    db.removeFile('cat3', function(data) {
//      // TODO what are we supposed to be checking here?
//      done();
//    });
//  });
//
//  it('Buffers are equal', function(done) {
//    var buf2 = fs.readFileSync(filename2),
//        buf3 = fs.readFileSync(filename3);
//
//    should.exist(buf2);
//    should.exist(buf3);
//
//    buf2.length.should.equal(buf3.length);
//
//    // TODO should there be a better comparison here?
//
//    // cleanup
//    fs.unlinkSync(filename2);
//    fs.unlinkSync(filename3);
//
//    done();
//  });
//});
