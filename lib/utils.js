module.exports = {

  /**
   * Mixes-in one object onto another. Properties defined on the right have precedence over those on the left.
   *
   * @param {Array} of {Object} arguments
   * @return {Object} result with all mixed-in properties
   * @api public
   */
  mixin: function() {
    var obj = {};
    
    Array.prototype.slice.call(arguments).forEach(function(arg) {
      for (var attrname in arg) { obj[attrname] = arg[attrname]; }
    });
    
    return obj;
  }
}
