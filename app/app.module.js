angular.module('app', ['ngRoute'])
  .run(['$rootScope', 'AuthService', function($rootScope, AuthService) {
    $rootScope.isAuthenticated = function() {
      return !!AuthService.getToken();
    };
  }]); 