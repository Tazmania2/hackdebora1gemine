angular.module('funifierApp').factory('PlayerService', function($http, $q, FUNIFIER_API_CONFIG) {
    var service = {};

    service.getPlayerProfile = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/player/me', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    service.getPlayerBalance = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/player/me/balance', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    service.getPlayerActivities = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/player/me/activity', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    service.getPlayerRewards = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/player/me/rewards', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    service.getPlayerEvents = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/player/me/events', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    service.generateReferralCode = function() {
        return $http.post(FUNIFIER_API_CONFIG.baseUrl + '/player/me/referral', {}, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    service.registerPurchase = function(purchaseData) {
        return $http.post(FUNIFIER_API_CONFIG.baseUrl + '/player/me/purchase', purchaseData, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    service.shareOnSocial = function(platform, proof) {
        return $http.post(FUNIFIER_API_CONFIG.baseUrl + '/player/me/share', {
            platform: platform,
            proof: proof
        }, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    service.answerSurvey = function(surveyId, answers) {
        return $http.post(FUNIFIER_API_CONFIG.baseUrl + '/player/me/survey/' + surveyId, answers, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    return service;
}); 