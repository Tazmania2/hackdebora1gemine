(function() {
    'use strict';

    angular
        .module('app')
        .factory('AuthInterceptor', AuthInterceptor);

    AuthInterceptor.$inject = ['$q', '$rootScope', 'AuthService'];

    function AuthInterceptor($q, $rootScope, AuthService) {
        var service = {
            request: request,
            response: response,
            responseError: responseError
        };

        return service;

        function request(config) {
            var token = AuthService.getToken();
            if (token) {
                config.headers.Authorization = 'Bearer ' + token;
            }
            return config;
        }

        function response(response) {
            return response;
        }

        function responseError(rejection) {
            if (rejection.status === 401) {
                $rootScope.$broadcast('unauthorized');
            }
            return $q.reject(rejection);
        }
    }
})(); 