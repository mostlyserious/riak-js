var seq = require('seq'),
  fs = require('fs'),
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
    // spawn ...
    
    console.log(file)
    this.ok()
  });