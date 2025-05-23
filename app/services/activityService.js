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
            getByDateRange: getByDateRange,
            logAction: logAction
        };

        return service;

        function getRecent() {
            var player = JSON.parse(localStorage.getItem('currentPlayer'));
            var userId = player && (player._id || player.name);
            return $http({
                method: 'GET',
                url: 'https://service2.funifier.com/v3/action/log',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token'),
                    'Content-Type': 'application/json'
                },
                params: {
                    userId: userId
                }
            });
        }

        function getByType(type) {
            var player = JSON.parse(localStorage.getItem('currentPlayer'));
            var userId = player && (player._id || player.name);
            return $http({
                method: 'GET',
                url: 'https://service2.funifier.com/v3/action/log',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token'),
                    'Content-Type': 'application/json'
                },
                params: {
                    userId: userId,
                    actionId: type
                }
            });
        }

        function getByDateRange(startDate, endDate) {
            var player = JSON.parse(localStorage.getItem('currentPlayer'));
            var userId = player && (player._id || player.name);
            return $http({
                method: 'GET',
                url: 'https://service2.funifier.com/v3/action/log',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token'),
                    'Content-Type': 'application/json'
                },
                params: {
                    userId: userId,
                    startDate: startDate,
                    endDate: endDate
                }
            });
        }

        function logAction(action) {
            var player = JSON.parse(localStorage.getItem('currentPlayer'));
            var userId = player && (player._id || player.name);
            return $http({
                method: 'POST',
                url: 'https://service2.funifier.com/v3/action/log',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token'),
                    'Content-Type': 'application/json'
                },
                data: {
                    actionId: action,
                    userId: userId,
                    attributes: {}
                }
            });
        }
    }
})(); 