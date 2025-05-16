// app/services/authService.js
angular.module('funifierApp')
.service('AuthService', function($http, $q, FUNIFIER_API_CONFIG) {
    var service = {};
    var currentPlayer = null;

    // Login with password authentication
    service.login = function(email, password) {
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

        return $http(req).then(function(response) {
            if (response.data && response.data.access_token) {
                localStorage.setItem('token', 'Bearer ' + response.data.access_token);
                return service.getPlayerInfo();
            }
            return $q.reject('Token não encontrado na resposta');
        });
    };

    // Get player information
    service.getPlayerInfo = function() {
        return $http({
            method: 'GET',
            url: FUNIFIER_API_CONFIG.baseUrl + '/v3/player/me',
            headers: {
                'Authorization': localStorage.getItem('token')
            }
        }).then(function(response) {
            service.storePlayerData(response.data);
            return response.data;
        });
    };

    // Store player data
    service.storePlayerData = function(playerData) {
        currentPlayer = playerData;
        localStorage.setItem('currentPlayer', JSON.stringify(playerData));
    };

    // Get current player
    service.getCurrentPlayer = function() {
        if (!currentPlayer) {
            var stored = localStorage.getItem('currentPlayer');
            if (stored) {
                currentPlayer = JSON.parse(stored);
            }
        }
        return currentPlayer;
    };

    // Check if user is authenticated
    service.isAuthenticated = function() {
        return !!localStorage.getItem('token');
    };

    // Logout
    service.logout = function() {
        localStorage.removeItem('token');
        localStorage.removeItem('currentPlayer');
        currentPlayer = null;
    };

    return service;
})
.factory('AuthInterceptor', function ($rootScope, $q, $window, $location, FUNIFIER_API_CONFIG) {
    return {
        request: function (config) {
            config.headers = config.headers || {};
            
            // Add token to all Funifier API requests except auth/token
            if (config.url.indexOf(FUNIFIER_API_CONFIG.baseUrl) === 0 && 
                !config.url.includes('/auth/token')) {
                var token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = token;
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
})
.config(function ($httpProvider) {
    $httpProvider.interceptors.push('AuthInterceptor');
});