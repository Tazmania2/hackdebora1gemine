angular.module('funifierApp').factory('PlayerService', function($http, $q, FUNIFIER_API_CONFIG, AuthService) {
    var service = {};

    service.getPlayerProfile = function() {
        return $http({
            method: 'GET',
            url: FUNIFIER_API_CONFIG.baseUrl + '/v3/player/me',
            headers: {
                'Authorization': localStorage.getItem('token')
            }
        }).then(function(response) {
            // Store the player data for later use
            localStorage.setItem('currentPlayer', JSON.stringify(response.data));
            return response;
        });
    };

    service.getPlayerBalance = function() {
        var player = service.getCurrentPlayer();
        if (!player || !player._id) {
            return $q.reject('Player ID not found');
        }
        return $http({
            method: 'GET',
            url: FUNIFIER_API_CONFIG.baseUrl + '/v3/player/' + player._id + '/status',
            headers: {
                'Authorization': localStorage.getItem('token')
            }
        });
    };

    service.getPlayerActivities = function() {
        return $http({
            method: 'GET',
            url: FUNIFIER_API_CONFIG.baseUrl + '/v3/player/me/activity',
            headers: {
                'Authorization': localStorage.getItem('token')
            }
        });
    };

    service.getPlayerRewards = function() {
        return $http({
            method: 'GET',
            url: FUNIFIER_API_CONFIG.baseUrl + '/v3/player/me/rewards',
            headers: {
                'Authorization': localStorage.getItem('token')
            }
        });
    };

    service.getPlayerEvents = function() {
        return $http({
            method: 'GET',
            url: FUNIFIER_API_CONFIG.baseUrl + '/v3/player/me/events',
            headers: {
                'Authorization': localStorage.getItem('token')
            }
        });
    };

    service.getCurrentPlayer = function() {
        var stored = localStorage.getItem('currentPlayer');
        if (stored) {
            return JSON.parse(stored);
        }
        return null;
    };

    service.generateReferralCode = function() {
        var token = localStorage.getItem('token');
        if (!token) {
            return $q.reject('User not authenticated');
        }

        return $http({
            method: 'POST',
            url: FUNIFIER_API_CONFIG.baseUrl + '/player/me/referral',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            data: {}
        });
    };

    service.registerPurchase = function(purchaseData) {
        return $http({
            method: 'POST',
            url: FUNIFIER_API_CONFIG.baseUrl + '/player/me/purchase',
            headers: {
                'Authorization': localStorage.getItem('token')
            },
            data: purchaseData
        });
    };

    service.shareOnSocial = function(platform, proof) {
        return $http({
            method: 'POST',
            url: FUNIFIER_API_CONFIG.baseUrl + '/player/me/share',
            headers: {
                'Authorization': localStorage.getItem('token')
            },
            data: {
                platform: platform,
                proof: proof
            }
        });
    };

    service.answerSurvey = function(surveyId, answers) {
        return $http({
            method: 'POST',
            url: FUNIFIER_API_CONFIG.baseUrl + '/player/me/survey/' + surveyId,
            headers: {
                'Authorization': localStorage.getItem('token')
            },
            data: answers
        });
    };

    return service;
}); 