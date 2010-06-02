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

require.paths.unshift("../lib");

var Riak = require('riak-node')
  assert = require('assert'),
  sys = require('sys');

var db = new Riak.Client({host: '127.0.0.1', port: 8098, debug: false}),
  bucket = 'riak-js-random-bucket',
  doc = "test",
  doc_json = "test-json",
  missing_doc = "I_do_not_exist",
  content = "this is a test",
  content_json = { a: 1, b: "test", c: false },
  content_json_2 = { a: 1, b: "test", c: true };

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
    assert.deepEqual(response2, content_json);
    db.save(bucket, doc_json, content_json_2)(function() {
      db.get(bucket, doc_json)(function(response3) {
        assert.deepEqual(response3, content_json_2);
      })
    })
    // check objects and meta (headers)
    // deepEqual response
  });
});

db.head(bucket, missing_doc)(function(response,meta){
  assert.equal(404, meta.statusCode);
});

db.head(bucket, doc)(function(response,meta){
  assert.equal(200, meta.statusCode);
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

