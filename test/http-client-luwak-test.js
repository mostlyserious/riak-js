var HttpClient = require('../lib/http-client'),
  seq = require('seq'),
  fs = require('fs'),
  assert = require('assert'),
  test = require('../lib/utils').test;

var db = new HttpClient({ port: 8098 }),
  filename = __dirname + '/fixtures/cat.jpg',
  filename2 = __dirname + '/fixtures/cat2.jpg',
  filename3 = __dirname + '/fixtures/cat3.jpg',
  image = fs.readFileSync(filename);

// seq()
// 
//   .seq(function() {
//     test('Save a file from a buffer');
//     
//     db.saveFile('cat2', image, { contentType: 'image/jpeg' }, function(err, data, meta) {
//       assert.ok(meta.statusCode, 204);
//       assert.ok(!data);
//       assert.equal(meta.key, 'cat2');
//       
//       // race condition - wait for riak
//       setTimeout(this.ok, 500);
//     }.bind(this));
//   })
//   
//   .seq(function() {
//     test('Get the file');
//     db.getFile('cat2', this);
//   })
//   .seq(function(data) {
//     assert.ok(data instanceof Buffer);
//     assert.deepEqual(data, image);
//     fs.writeFileSync(filename2, data);
//     this.ok();
//   })
//   
//   .seq(function() {
//     test('Remove the file');
//     db.removeFile('cat2', this);
//   })
//   .seq(function(data) {
//     // TODO assert something
//     this.ok();
//   })
//   
//   .seq(function() {
//     test('Save a file from a stream');
//     db.saveFile('cat3', fs.createReadStream(filename), { contentType: 'image/jpeg' }, function(err, data, meta) {
//       assert.equal(meta.statusCode, 204);
//       assert.ok(!data);
//       assert.equal(meta.key, 'cat3');
//       
//       // race condition - wait for riak
//       setTimeout(this.ok, 500);
//     }.bind(this));
//   })
//   
//   // TODO test luwak with returnbody=true
//   
//   .seq(function() {
//     test('Get the file stream');
//     db.getFile('cat3', { stream: true }, this);
//   })
//   .seq(function(stream) {
//     
//     assert.ok(stream);
//     
//     var out = fs.createWriteStream(filename3);
//     stream.pipe(out);
//     
//     out.on('close', function() {
//       this.ok();
//     }.bind(this));
//     
//   })
//   
//   .seq(function() {
//     test('Remove the file');
//     db.removeFile('cat3', this);
//   })
//   .seq(function(data) {
//     this.ok()
//     // TODO assert something
//   })
//   
//   .seq(function() {
//     test('Buffers are equal');
//     
//     var buf2 = fs.readFileSync(filename2),
//       buf3 = fs.readFileSync(filename3);
// 
//     // assert.deepEqual(buf2, buf3);
//     assert.equal(buf3.length, image.length);
//     
//     // cleanup
//     fs.unlinkSync(filename2);
//     fs.unlinkSync(filename3);
//     
//     this.ok();
//     
//   })
//     
//   .catch(function(err) {
//     console.log(err.stack);
//     process.exit(1);
//   });
