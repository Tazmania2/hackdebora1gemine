angular.module('app').filter('sumPoints', function() {
  return function(pointsArr) {
    if (!Array.isArray(pointsArr)) return 0;
    return pointsArr.reduce(function(sum, p) { return sum + (parseFloat(p.total) || 0); }, 0);
  };
}); 