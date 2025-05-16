angular.module('funifierApp').factory('PlayerService', function($http, $q, FUNIFIER_API_CONFIG, AuthService) {
    var service = {};

    service.getPlayerProfile = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/player/me', {
            headers: {
                'Authorization': AuthService.getBasicAuthToken()
            }
        });
    };

    service.getPlayerBalance = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/player/me/balance', {
            headers: {
                'Authorization': AuthService.getBasicAuthToken()
            }
        });
    };

    service.getPlayerActivities = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/player/me/activity', {
            headers: {
                'Authorization': AuthService.getBasicAuthToken()
            }
        });
    };

    service.getPlayerRewards = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/player/me/rewards', {
            headers: {
                'Authorization': AuthService.getBasicAuthToken()
            }
        });
    };

    service.getPlayerEvents = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/player/me/events', {
            headers: {
                'Authorization': AuthService.getBasicAuthToken()
            }
        });
    };

    service.generateReferralCode = function() {
        return $http.post(FUNIFIER_API_CONFIG.baseUrl + '/player/me/referral', {}, {
            headers: {
                'Authorization': AuthService.getBasicAuthToken()
            }
        });
    };

    service.registerPurchase = function(purchaseData) {
        return $http.post(FUNIFIER_API_CONFIG.baseUrl + '/player/me/purchase', purchaseData, {
            headers: {
                'Authorization': AuthService.getBasicAuthToken()
            }
        });
    };

    service.shareOnSocial = function(platform, proof) {
        return $http.post(FUNIFIER_API_CONFIG.baseUrl + '/player/me/share', {
            platform: platform,
            proof: proof
        }, {
            headers: {
                'Authorization': AuthService.getBasicAuthToken()
            }
        });
    };

    service.answerSurvey = function(surveyId, answers) {
        return $http.post(FUNIFIER_API_CONFIG.baseUrl + '/player/me/survey/' + surveyId, answers, {
            headers: {
                'Authorization': AuthService.getBasicAuthToken()
            }
        });
    };

    return service;
}); 