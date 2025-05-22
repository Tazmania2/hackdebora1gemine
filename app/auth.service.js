angular.module('app')
  .service('AuthService', ['$http', '$q', 'FUNIFIER_API_CONFIG', '$location',
    function($http, $q, CONFIG, $location) {
      this.getToken = function() {
        return localStorage.getItem('token');
      };
      this.login = function(email, password) {
        var deferred = $q.defer();
        $http({
          method: 'POST',
          url: CONFIG.service + '/auth/token',
          headers: {
            'Authorization': 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==',
            'Content-Type': 'application/json'
          },
          data: {
            apiKey: CONFIG.apiKey,
            grant_type: 'password',
            username: email,
            password: password
          }
        })
        .then(function(response) {
          if (response.data && response.data.access_token) {
            localStorage.setItem('token', 'Bearer ' + response.data.access_token);
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
      this.isAuthenticated = function() {
        return !!localStorage.getItem('token');
      };
    }
  ]); 