angular.module('app')
  .run(['$rootScope', 'AuthService', '$location', function($rootScope, AuthService, $location) {
    $rootScope.isAuthenticated = function() {
      return !!AuthService.getToken();
    };
    $rootScope.logout = function() {
      localStorage.removeItem('token');
      $location.path('/login');
    };
  }]); 