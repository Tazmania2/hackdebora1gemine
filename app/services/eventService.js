(function() {
    'use strict';

    angular
        .module('app')
        .service('EventService', EventService);

    EventService.$inject = ['$http', 'API_URL'];

    function EventService($http, API_URL) {
        var service = {
            getUpcoming: getUpcoming,
            getById: getById,
            register: register,
            unregister: unregister,
            getRegisteredEvents: getRegisteredEvents
        };

        return service;

        function getUpcoming() {
            return $http.get(API_URL + '/events/upcoming');
        }

        function getById(eventId) {
            return $http.get(API_URL + '/events/' + eventId);
        }

        function register(eventId) {
            return $http.post(API_URL + '/events/' + eventId + '/register');
        }

        function unregister(eventId) {
            return $http.post(API_URL + '/events/' + eventId + '/unregister');
        }

        function getRegisteredEvents() {
            return $http.get(API_URL + '/events/registered');
        }
    }
})(); 