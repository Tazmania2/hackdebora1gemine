(function() {
    'use strict';

    angular
        .module('app')
        .service('EventService', EventService);

    EventService.$inject = ['$http', 'FUNIFIER_API_CONFIG'];

    function EventService($http, FUNIFIER_API_CONFIG) {
        var baseUrl = FUNIFIER_API_CONFIG.baseUrl;
        var service = {
            getUpcoming: getUpcoming,
            getById: getById,
            register: register,
            unregister: unregister,
            getRegisteredEvents: getRegisteredEvents
        };

        return service;

        function getUpcoming() {
            return $http.get(baseUrl + '/events/upcoming');
        }

        function getById(eventId) {
            return $http.get(baseUrl + '/events/' + eventId);
        }

        function register(eventId) {
            return $http.post(baseUrl + '/events/' + eventId + '/register');
        }

        function unregister(eventId) {
            return $http.post(baseUrl + '/events/' + eventId + '/unregister');
        }

        function getRegisteredEvents() {
            return $http.get(baseUrl + '/events/registered');
        }
    }
})(); 