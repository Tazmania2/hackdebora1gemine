angular.module('app')
  .service('AuthService', ['$http', '$q', 'FUNIFIER_API_CONFIG', '$location',
    function($http, $q, CONFIG, $location) {
      this.getToken = function() {
        return localStorage.getItem('token');
      };
      this.login = function(email, password) {
        var deferred = $q.defer();
        $http.post(CONFIG.service + '/login', { email: email, password: password })
          .then(function(response) {
            if (response.data && response.data.token) {
              localStorage.setItem('token', response.data.token);
              deferred.resolve(response);
            } else {
              deferred.reject({ data: { message: 'Token não recebido do servidor.' } });
            }
          })
          .catch(function(error) {
            deferred.reject(error);
          });
        return deferred.promise;
      };
      this.handle401 = function() {
        $location.path('/login');
      };
    }
  ]); 