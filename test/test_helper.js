var async = require('async');
var HttpClient = require('../lib/http-client');

var helpers = module.exports = {
  cleanupBucket: function (bucket, done) {
    var db = new HttpClient({ port: 8098 });
    var allKeys = [];
    var onKeys = function (keys) {
      allKeys = allKeys.concat(keys);
    };
    var onEnd = function () {
      async.each(
        allKeys,
        function (key, cb) {
          db.remove(bucket, key, function (err) {
            cb();
          });
        },
        function (err) {
          if (err) throw err;
          done();
        }
      );
    };
    db.keys(bucket)
      .on('keys', onKeys)
      .on('end', onEnd)
      .start();
  }
};
