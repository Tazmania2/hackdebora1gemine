angular.module('funifierApp').factory('RewardsService', function($http, $q, FUNIFIER_API_CONFIG) {
    var service = {};

    service.getRewardsCatalog = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/rewards', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    service.getRewardDetails = function(rewardId) {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/rewards/' + rewardId, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    service.redeemReward = function(rewardId) {
        return $http.post(FUNIFIER_API_CONFIG.baseUrl + '/rewards/' + rewardId + '/redeem', {}, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    service.getRedeemedRewards = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/rewards/redeemed', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    service.getRewardHistory = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/rewards/history', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    return service;
}); 