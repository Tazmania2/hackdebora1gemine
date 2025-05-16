// app/services/authService.js
angular.module('funifierApp')
.service('AuthService', function($http, $q, FUNIFIER_API_CONFIG) {
    var service = {};
    var currentPlayer = null;
    var API_KEY = '68252a212327f74f3a3d100d';

    // Get Basic auth token for server-side operations
    service.getBasicAuthToken = function() {
        return 'Basic ' + btoa(API_KEY + ':' + FUNIFIER_API_CONFIG.appSecret);
    };

    // Login with password authentication
    service.login = function(email, password) {
        var data = {
            apiKey: API_KEY,
            username: email,
            password: password,
            grant_type: 'password'
        };

        // Convert data to URL-encoded format
        var formData = Object.keys(data)
            .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
            .join('&');

        return $http({
            method: 'POST',
            url: FUNIFIER_API_CONFIG.baseUrl + '/auth/token',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-API-Key': API_KEY
            },
            data: formData
        }).then(function(response) {
            if (response.data && response.data.token) {
                localStorage.setItem('token', response.data.token);
                return service.getPlayerInfo(email);
            }
            return $q.reject('Token não encontrado na resposta');
        });
    };

    // Get player information
    service.getPlayerInfo = function(email) {
        return $http({
            method: 'GET',
            url: FUNIFIER_API_CONFIG.baseUrl + '/player/' + email,
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
                'X-API-Key': API_KEY
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
    var API_KEY = '68252a212327f74f3a3d100d';
    
    return {
        request: function (config) {
            config.headers = config.headers || {};
            
            // Add API key to all Funifier API requests
            if (config.url.indexOf(FUNIFIER_API_CONFIG.baseUrl) === 0) {
                config.headers['X-API-Key'] = API_KEY;
                
                // Use Basic Auth for server-side operations
                if (config.url.includes('/player') && !config.url.includes('/auth/token')) {
                    // If we have a token, use Bearer auth for player-specific operations
                    var token = localStorage.getItem('token');
                    if (token) {
                        config.headers.Authorization = 'Bearer ' + token;
                    } else {
                        // Use Basic Auth for registration and public info
                        config.headers.Authorization = 'Basic ' + btoa(API_KEY + ':' + FUNIFIER_API_CONFIG.appSecret);
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
})
.config(function ($httpProvider) {
    $httpProvider.interceptors.push('AuthInterceptor');
});