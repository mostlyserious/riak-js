module.exports = {
  
  mixin: function() {
    var obj = {};
    
    Array.prototype.slice.call(arguments).forEach(function(arg) {
      // console.log('in mixin')
      // console.dir(arg)
      for (var attrname in arg) { obj[attrname] = arg[attrname]; }
    });
    
    return obj;
  },
  
  test: function(s) {
    console.log('- \033[1;37m' + s + '\033[0;37m');
  }
  
}

// process.on('uncaughtException', function(err) {
//   console.log(err.stack);
//   console.log('\n[\033[31m' + 'FAILURE' + '\033[39m]');
// });