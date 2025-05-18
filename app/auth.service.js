angular.module('app')
  .service('AuthService', ['$http', '$q', 'FUNIFIER_API_CONFIG', '$location',
    function($http, $q, CONFIG, $location) {
      this.getToken = function() {
        return localStorage.getItem('token');
      };
      this.login = function(credentials) {
        return $http.post(CONFIG.service + '/login', credentials);
      };
      this.handle401 = function() {
        $location.path('/login');
      };
    }
  ]); 