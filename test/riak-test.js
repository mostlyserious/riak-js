// This file is provided to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file
// except in compliance with the License.  You may obtain
// a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

var sys = require('sys'),
  Riak = require('../riak-node')
  assert = require('assert');

var db = new Riak.Client(),
  bucket = 'riak-js-random-bucket',
  doc = "test",
  doc_json = "test-json",
  content = "this is a test",
  content_json = { a: 1, b: "test", c: false };

db.save(bucket, doc, content, {returnbody: true})(function(response, meta) {
  assert.ok(response);
  assert.notEqual(204, meta.statusCode);

  db.get(bucket, doc)(function(response2) {
    assert.equal(response2, content);
    db.remove(bucket, doc)(function() {
      db.get(bucket, doc)(null, function(r, meta3) {
        assert.equal(404, meta3.statusCode);
      });
    });
  });
});

db.save(bucket, doc_json, content_json)(function(response, meta) {
  assert.equal(204, meta.statusCode);
  db.get(bucket, doc_json)(function(response2, meta2) {
    // check objects and meta (headers)
    // deepEqual response
  });
});


// wait 2 seconds and delete all documents from the test bucket no matter what
var nothing = function() {};

var func = function() { db.get(bucket)(function(resp) {
    resp.keys.forEach(function(key) {
     db.remove(bucket, key)();
    });
  });
}

setTimeout(func, 2000);