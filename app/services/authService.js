// app/services/authService.js
angular.module('app')
.service('AuthService', function($http, $q, FUNIFIER_API_CONFIG) {
    var currentPlayer = null;

    // Login with password authentication
    this.login = function(email, password) {
        console.log('Attempting login for:', email);
        var req = {
            method: 'POST',
            url: FUNIFIER_API_CONFIG.baseUrl + '/auth/token',
            headers: {
                'Authorization': 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==',
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
            console.log('Login response:', response.data);
            if (response.data && response.data.access_token) {
                // Store the token with 'Bearer ' prefix
                localStorage.setItem('token', 'Bearer ' + response.data.access_token);
                return this.getPlayerInfo();
            }
            return $q.reject('Token não encontrado na resposta');
        }).catch(function(error) {
            console.error('Login error:', error);
            return $q.reject(error);
        });
    };

    // Get player information
    this.getPlayerInfo = function() {
        console.log('Getting player info...');
        return $http({
            method: 'GET',
            url: FUNIFIER_API_CONFIG.baseUrl + '/player/me',
            headers: {
                'Authorization': localStorage.getItem('token')
            }
        }).then((response) => {
            console.log('Player info received:', response.data);
            this.storePlayerData(response.data);
            return response.data;
        }).catch(function(error) {
            console.error('Error getting player info:', error);
            return $q.reject(error);
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
                currentPlayer = JSON.parse(stored);
            }
        }
        return currentPlayer;
    };

    // Check if user is authenticated
    this.isAuthenticated = function() {
        var token = localStorage.getItem('token');
        console.log('[AuthService.isAuthenticated] token:', token);
        if (token) {
            return Promise.resolve(true);
        } else {
            console.error('[AuthService.isAuthenticated] User not authenticated');
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
      // Debug log for Authorization header
      console.log('[AuthInterceptor] Before:', config.url, 'Authorization:', config.headers.Authorization);
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
      // Debug log after possible modification
      console.log('[AuthInterceptor] After:', config.url, 'Authorization:', config.headers.Authorization);
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