var seq = require('seq'),
  fs = require('fs'),
  util = require('util'),
  spawn = require('child_process').spawn,
  files = fs.readdirSync(__dirname);
  
files = files
  .map(function(f) {
    return __dirname + '/' + f;
  })
  .filter(function(f) {
    var stat = fs.statSync(f);
    return stat.isFile() && f != __filename;
  });

seq(files)
  .seqEach(function(file) {
    console.log("=> " + file);
    exec(file, this);
  })
  .seq(function() {
    console.log('[\033[32m' + 'SUCCESS' + '\033[39m]');
  });
  


function exec(test, callback) {
  
  var child = spawn('node', [test]);
  child.stdout.pipe(process.stdout, { end: false });
  child.stderr.pipe(process.stderr, { end: false });
  
  child.on('exit', function(code) {
    console.log();
    if (code == 0) return callback(null);
    console.error('[\033[31m' + 'FAILURE' + '\033[39m] ' + test + " returned with code " + code);
    process.exit(code);
  });
  
}
