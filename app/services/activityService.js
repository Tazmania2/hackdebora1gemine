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
            logAction: logAction,
            sendSmsNotification: sendSmsNotification
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

        /**
         * Send an SMS notification via Vonage, fetching credentials from Funifier
         * @param {string} to - The recipient's phone number (E.164 format, e.g., +5511999999999)
         * @param {string} message - The message to send
         * @returns {Promise}
         */
        function sendSmsNotification(to, message) {
            // 1. Fetch Vonage credentials from Funifier
            return $http({
                method: 'GET',
                url: "https://service2.funifier.com/v3/database/integration_secrets__c?q=_id:'vonage_sms'",
                headers: { 'Authorization': 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==' }
            }).then(function(resp) {
                var creds = resp.data && resp.data[0];
                if (!creds || !creds.apiKey || !creds.apiSecret) {
                    return Promise.reject('Vonage credentials not found in Funifier');
                }
                // 2. Send SMS via Vonage API
                return $http({
                    method: 'POST',
                    url: 'https://rest.nexmo.com/sms/json',
                    headers: { 'Content-Type': 'application/json' },
                    data: {
                        api_key: creds.apiKey,
                        api_secret: creds.apiSecret,
                        to: to,
                        from: 'Funifier',
                        text: message
                    }
                });
            });
        }
    }
})(); 