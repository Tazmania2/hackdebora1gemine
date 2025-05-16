// app/services/authService.js
angular.module('funifierApp').factory('AuthService', function($http, $q, $window, FUNIFIER_API_CONFIG) {
    var PLAYER_DATA_KEY = 'funifierPlayerData';
    var isAuthenticatedState = false;
    var BASIC_AUTH_TOKEN = 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==';

    function storePlayerData(playerData) {
        if (playerData) {
            $window.localStorage.setItem(PLAYER_DATA_KEY, JSON.stringify(playerData));
            isAuthenticatedState = true;
        }
    }

    function destroyAuthData() {
        isAuthenticatedState = false;
        $window.localStorage.removeItem(PLAYER_DATA_KEY);
    }

    var playerLogin = function(email, password) {
        var deferred = $q.defer();
        if (email && password) {
            var mockPlayerData = { playerId: 'mockPlayer123', email: email, name: 'Jogador Teste' };
            storePlayerData(mockPlayerData);
            deferred.resolve(mockPlayerData);
        } else {
            deferred.reject('Email ou senha inválidos.');
        }
        return deferred.promise;
    };
    
    var requestPasswordResetCode = function(email) {
        return $http({
            method: 'GET',
            url: FUNIFIER_API_CONFIG.passwordResetBaseUrl + '/system/user/password/code',
            params: { user: email },
            headers: {
                'Authorization': BASIC_AUTH_TOKEN
            }
        });
    };

    var logout = function() {
        destroyAuthData();
    };

    return {
        playerLogin: playerLogin,
        logout: logout,
        requestPasswordResetCode: requestPasswordResetCode,
        isAuthenticated: function() { return isAuthenticatedState; },
        getCurrentPlayer: function() {
            var playerDataString = $window.localStorage.getItem(PLAYER_DATA_KEY);
            return playerDataString ? JSON.parse(playerDataString) : null;
        },
        getBasicAuthToken: function() { return BASIC_AUTH_TOKEN; },
        storePlayerData: storePlayerData
    };
})
.factory('AuthInterceptor', function ($rootScope, $q, $window, $location, FUNIFIER_API_CONFIG) {
    return {
        request: function (config) {
            config.headers = config.headers || {};
            
            // Se for uma requisição para a API Funifier
            if (config.url.indexOf('https://service2.funifier.com/v3') === 0) {
                config.headers.Authorization = 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==';
            }
            return config;
        },
        responseError: function (response) {
            if (response.status === 401 && response.config.url.indexOf('https://service2.funifier.com/v3') === 0) {
                $window.localStorage.removeItem('funifierPlayerData');
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