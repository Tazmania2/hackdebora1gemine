(function() {
    'use strict';

    angular
        .module('app')
        .service('ActivityService', ActivityService);

    ActivityService.$inject = ['$http', 'FUNIFIER_API_CONFIG'];

    function ActivityService($http, FUNIFIER_API_CONFIG) {
        var baseUrl = FUNIFIER_API_CONFIG.baseUrl;
        var service = {
            getRecent: getRecent,
            getByType: getByType,
            getByDateRange: getByDateRange
        };

        return service;

        function getRecent() {
            return $http.get(baseUrl + '/activities/recent');
        }

        function getByType(type) {
            return $http.get(baseUrl + '/activities/type/' + type);
        }

        function getByDateRange(startDate, endDate) {
            return $http.get(baseUrl + '/activities/range', {
                params: {
                    startDate: startDate,
                    endDate: endDate
                }
            });
        }
    }
})(); 