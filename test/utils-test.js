var assert = require('assert'),
  utils = require('../lib/utils'),
  test = utils.test;
  
test('Utils mixin');

  var o1 = { a: 1, b: 2, g: 8 },
    o2 = { b: 3, c: 4 },
    o3 = { b: 5, d: 6 };
  
  assert.deepEqual(utils.mixin(o1, o2, o3), { a: 1, b: 5, c: 4, d: 6, g: 8 })