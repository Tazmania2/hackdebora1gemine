angular.module('funifierApp').factory('RewardsService', function($http, $q, FUNIFIER_API_CONFIG, AuthService) {
    var service = {};

    service.getRewardsCatalog = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/rewards', {
            headers: {
                'Authorization': AuthService.getBasicAuthToken()
            }
        });
    };

    service.getRewardDetails = function(rewardId) {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/rewards/' + rewardId, {
            headers: {
                'Authorization': AuthService.getBasicAuthToken()
            }
        });
    };

    service.redeemReward = function(rewardId) {
        return $http.post(FUNIFIER_API_CONFIG.baseUrl + '/rewards/' + rewardId + '/redeem', {}, {
            headers: {
                'Authorization': AuthService.getBasicAuthToken()
            }
        });
    };

    service.getRedeemedRewards = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/rewards/redeemed', {
            headers: {
                'Authorization': AuthService.getBasicAuthToken()
            }
        });
    };

    service.getRewardHistory = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/rewards/history', {
            headers: {
                'Authorization': AuthService.getBasicAuthToken()
            }
        });
    };

    return service;
}); 