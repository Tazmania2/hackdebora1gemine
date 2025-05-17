(function() {
    'use strict';

    angular
        .module('app')
        .service('ActivityService', ActivityService);

    ActivityService.$inject = ['$http', 'API_URL'];

    function ActivityService($http, API_URL) {
        var service = {
            getRecent: getRecent,
            getByType: getByType,
            getByDateRange: getByDateRange
        };

        return service;

        function getRecent() {
            return $http.get(API_URL + '/activities/recent');
        }

        function getByType(type) {
            return $http.get(API_URL + '/activities/type/' + type);
        }

        function getByDateRange(startDate, endDate) {
            return $http.get(API_URL + '/activities/range', {
                params: {
                    startDate: startDate,
                    endDate: endDate
                }
            });
        }
    }
})(); 