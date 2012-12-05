var should = require('should'),
  utils = require('../lib/utils');

describe('Utils-tests', function() {
  it('Should mixin correctly', function(done) {
    var o1 = { a: 1, b: 2, g: 8 },
      o2 = { b: 3, c: 4 },
      o3 = { b: 5, d: 6 };

    utils.mixin(o1, o2, o3).should.eql({ a: 1, b: 5, c: 4, d: 6, g: 8 });
    done();
  });
});
