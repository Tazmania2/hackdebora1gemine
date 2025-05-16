angular.module('funifierApp').factory('PlayerService', function($http, $q, FUNIFIER_API_CONFIG, AuthService) {
    var service = {};

    service.getPlayerProfile = function() {
        return $http({
            method: 'GET',
            url: FUNIFIER_API_CONFIG.baseUrl + '/player/profile',
            headers: {
                'Authorization': localStorage.getItem('token')
            }
        });
    };

    service.getPlayerBalance = function() {
        return $http({
            method: 'GET',
            url: FUNIFIER_API_CONFIG.baseUrl + '/player/me/balance',
            headers: {
                'Authorization': localStorage.getItem('token')
            }
        });
    };

    service.getPlayerActivities = function() {
        return $http({
            method: 'GET',
            url: FUNIFIER_API_CONFIG.baseUrl + '/player/me/activity',
            headers: {
                'Authorization': localStorage.getItem('token')
            }
        });
    };

    service.getPlayerRewards = function() {
        return $http({
            method: 'GET',
            url: FUNIFIER_API_CONFIG.baseUrl + '/player/me/rewards',
            headers: {
                'Authorization': localStorage.getItem('token')
            }
        });
    };

    service.getPlayerEvents = function() {
        return $http({
            method: 'GET',
            url: FUNIFIER_API_CONFIG.baseUrl + '/player/me/events',
            headers: {
                'Authorization': localStorage.getItem('token')
            }
        });
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