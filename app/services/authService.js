// app/services/authService.js
angular.module('app')
.service('AuthService', function($http, $q, FUNIFIER_API_CONFIG) {
    var currentPlayer = null;
    var basicAuth = window.FUNIFIER_BASIC_AUTH || 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==';

    // Login with password authentication
    this.login = function(email, password) {
        if (!email || !password) {
            return $q.reject('Email and password are required');
        }

        var req = {
            method: 'POST',
            url: FUNIFIER_API_CONFIG.baseUrl + '/auth/token',
            headers: {
                'Authorization': basicAuth,
                'Content-Type': 'application/json'
            },
            data: {
                apiKey: FUNIFIER_API_CONFIG.apiKey,
                grant_type: 'password',
                username: email,
                password: password
            }
        };

        return $http(req).then((response) => {
            if (response.data && response.data.access_token) {
                // Store the token with 'Bearer ' prefix
                localStorage.setItem('token', 'Bearer ' + response.data.access_token);
                return this.getPlayerInfo();
            }
            return $q.reject('Token não encontrado na resposta');
        }).catch(function(error) {
            var errorMessage = 'Erro ao fazer login';
            if (error.data && error.data.error_description) {
                errorMessage = error.data.error_description;
            } else if (error.status === 401) {
                errorMessage = 'Email ou senha incorretos';
            } else if (error.status === 0) {
                errorMessage = 'Erro de conexão. Verifique sua internet.';
            }
            return $q.reject(errorMessage);
        });
    };

    // Get player information
    this.getPlayerInfo = function() {
        return $http({
            method: 'GET',
            url: FUNIFIER_API_CONFIG.baseUrl + '/player/me',
            headers: {
                'Authorization': localStorage.getItem('token')
            }
        }).then((response) => {
            this.storePlayerData(response.data);
            return response.data;
        }).catch(function(error) {
            var errorMessage = 'Erro ao carregar informações do usuário';
            if (error.status === 401) {
                errorMessage = 'Sessão expirada. Faça login novamente.';
            }
            return $q.reject(errorMessage);
        });
    };

    // Store player data
    this.storePlayerData = function(playerData) {
        currentPlayer = playerData;
        localStorage.setItem('currentPlayer', JSON.stringify(playerData));
    };

    // Get current player
    this.getCurrentPlayer = function() {
        if (!currentPlayer) {
            var stored = localStorage.getItem('currentPlayer');
            if (stored) {
                try {
                    currentPlayer = JSON.parse(stored);
                } catch (e) {
                    localStorage.removeItem('currentPlayer');
                    currentPlayer = null;
                }
            }
        }
        return currentPlayer;
    };

    // Check if user is authenticated
    this.isAuthenticated = function() {
        var token = localStorage.getItem('token');
        if (token) {
            return Promise.resolve(true);
        } else {
            return Promise.reject('not_authenticated');
        }
    };

    // Logout
    this.logout = function() {
        localStorage.removeItem('token');
        localStorage.removeItem('currentPlayer');
        currentPlayer = null;
        if (window.sessionStorage) sessionStorage.clear();
        // Force reload to ensure all state is cleared and user is redirected
        window.location.href = '/#!/login';
    };
});

angular.module('app')
.factory('AuthInterceptor', function ($rootScope, $q, $window, $location, FUNIFIER_API_CONFIG) {
  return {
    request: function (config) {
      config.headers = config.headers || {};
      
      // Only set Authorization if it is not already set
      if (config.url.indexOf(FUNIFIER_API_CONFIG.baseUrl) === 0 && 
          !config.url.includes('/auth/token')) {
        if (!config.headers.Authorization) {
          var token = localStorage.getItem('token');
          if (token) {
            config.headers.Authorization = token;
          }
        }
      }
      return config;
    },
    responseError: function (response) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('currentPlayer');
        if ($location.path() !== '/login') {
          $location.path('/login');
        }
      }
      return $q.reject(response);
    }
  };
});

angular.module('app')
.config(function ($httpProvider) {
  $httpProvider.interceptors.push('AuthInterceptor');
});