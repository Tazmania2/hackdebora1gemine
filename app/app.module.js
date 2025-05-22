angular.module('app')
  .run(['$rootScope', 'AuthService', '$location', '$log', function($rootScope, AuthService, $location, $log) {
    $log = $log || console;
    $log.debug && $log.debug('[app.module.js] run block executed');
    $rootScope.isAuthenticated = function() {
      return !!AuthService.getToken();
    };
    $rootScope.logout = function() {
      localStorage.removeItem('token');
      $location.path('/login');
    };
  }]); 