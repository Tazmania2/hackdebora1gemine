angular.module('app').filter('someEmpty', function() {
  return function(attrs, values) {
    if (!Array.isArray(attrs)) return false;
    return attrs.some(function(attr) { return !values[attr]; });
  };
}); 