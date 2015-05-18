var async = require('async');
var HttpClient = require('./http-test-client');

var helpers = module.exports = {
  cleanupBucket: function (bucket, done) {
    var db = new HttpClient();
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
    db.keys(bucket, {keys: 'stream'} )
      .on('keys', onKeys)
      .on('end', onEnd)
      .start();
  }
};
