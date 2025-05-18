angular.module('app')
  .factory('AuthInterceptor', ['$q','$injector', function($q,$injector) {
    return {
      request(config) {
        var cfg   = $injector.get('FUNIFIER_API_CONFIG');
        var Auth  = $injector.get('AuthService');
        var token = Auth.getToken();
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = 'Bearer ' + token;
        }
        return config;
      },
      responseError(rejection) {
        return $q.reject(rejection);
      }
    };
  }])
  .config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('AuthInterceptor');
  }]); 