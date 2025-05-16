// app/services/authService.js
angular.module('funifierApp').factory('AuthService', function($http, $q, $window, FUNIFIER_API_CONFIG) {
    var LOCAL_TOKEN_KEY = 'funifierAuthToken';
    var PLAYER_DATA_KEY = 'funifierPlayerData'; // Para armazenar dados do jogador logado
    var isAuthenticatedState = false;
    var authToken;

    function loadAuthData() {
        var token = $window.sessionStorage.getItem(LOCAL_TOKEN_KEY);
        if (token) {
            useCredentials(token);
        }
    }

    function storeAuthData(token, playerData) {
        $window.sessionStorage.setItem(LOCAL_TOKEN_KEY, token);
        if (playerData) {
            $window.sessionStorage.setItem(PLAYER_DATA_KEY, JSON.stringify(playerData));
        }
        useCredentials(token);
    }

    function useCredentials(token) {
        isAuthenticatedState = true;
        authToken = token;
        $http.defaults.headers.common.Authorization = 'Bearer ' + token;
    }

    function destroyAuthData() {
        authToken = undefined;
        isAuthenticatedState = false;
        $http.defaults.headers.common.Authorization = undefined;
        $window.sessionStorage.removeItem(LOCAL_TOKEN_KEY);
        $window.sessionStorage.removeItem(PLAYER_DATA_KEY);
    }

    var getApiToken = function() {
        var deferred = $q.defer();
        if (authToken) {
            deferred.resolve(authToken);
            return deferred.promise;
        }

        // Criar o token Basic com apiKey e appSecret
        var credentials = btoa(FUNIFIER_API_CONFIG.apiKey + ':' + FUNIFIER_API_CONFIG.appSecret);

        $http.post('https://service2.funifier.com/v3/auth/basic', {}, {
            headers: {
                'Authorization': 'Basic ' + credentials,
                'Content-Type': 'application/json'
            }
        }).then(function(result) {
            if (result.data && result.data.Authorization) {
                storeAuthData(result.data.Authorization);
                deferred.resolve(result.data.Authorization);
            } else {
                deferred.reject('Falha ao obter token: Nenhuma Authorization recebida.');
            }
        }, function(error) {
            destroyAuthData();
            var errorMsg = 'Falha ao obter token da API: ';
            if (error.data && (error.data.error_description || error.data.message || error.data.error)) {
                errorMsg += error.data.error_description || error.data.message || error.data.error;
            } else if (error.statusText) {
                errorMsg += error.statusText;
            } else {
                errorMsg += 'Erro desconhecido.';
            }
            deferred.reject(errorMsg);
        });
        return deferred.promise;
    };

    var playerLogin = function(email, password) {
        var deferred = $q.defer();
        getApiToken().then(function(apiToken) {
            if (email && password) {
                var mockPlayerData = { playerId: 'mockPlayer123', email: email, name: 'Jogador Teste' };
                storeAuthData(apiToken, mockPlayerData);
                deferred.resolve(mockPlayerData);
            } else {
                deferred.reject('Email ou senha inválidos.');
            }
        }, function(error) {
            deferred.reject('Falha ao obter token da API antes do login do jogador: ' + error);
        });
        return deferred.promise;
    };
    
    var requestPasswordResetCode = function(email) {
        return $http.get(FUNIFIER_API_CONFIG.passwordResetBaseUrl + '/system/user/password/code?user=' + encodeURIComponent(email));
    };

    var logout = function() {
        destroyAuthData();
    };

    loadAuthData();

    return {
        getApiToken: getApiToken,
        playerLogin: playerLogin,
        logout: logout,
        requestPasswordResetCode: requestPasswordResetCode,
        isAuthenticated: function() { return isAuthenticatedState; },
        getCurrentPlayer: function() {
            var playerDataString = $window.sessionStorage.getItem(PLAYER_DATA_KEY);
            return playerDataString ? JSON.parse(playerDataString) : null;
        },
        getToken: function() { return authToken; }
    };
})
.factory('AuthInterceptor', function ($rootScope, $q, $window, $location, FUNIFIER_API_CONFIG) {
    return {
        request: function (config) {
            config.headers = config.headers || {};
            var token = $window.sessionStorage.getItem('funifierAuthToken');
            if (token && config.url.indexOf('https://service2.funifier.com/v3') === 0 && !config.url.includes('/auth/basic')) {
                config.headers.Authorization = 'Bearer ' + token;
            }
            return config;
        },
        responseError: function (response) {
            if (response.status === 401 && response.config.url.indexOf('https://service2.funifier.com/v3') === 0 && !response.config.url.includes('/auth/basic')) {
                $window.sessionStorage.removeItem('funifierAuthToken');
                $window.sessionStorage.removeItem('funifierPlayerData');
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