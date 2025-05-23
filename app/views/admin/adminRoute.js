angular.module('app').config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/admin', {
    templateUrl: 'app/views/admin/adminView.html',
    controller: 'AdminController',
    controllerAs: 'vm'
  });
}]); 