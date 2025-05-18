angular.module('app', ['ngRoute'])
  .run(['$rootScope', 'AuthService', '$location', function($rootScope, AuthService, $location) {
    $rootScope.isAuthenticated = function() {
      return !!AuthService.getToken();
    };
    $rootScope.logout = function() {
      localStorage.removeItem('token');
      $location.path('/login');
    };
  }]); 