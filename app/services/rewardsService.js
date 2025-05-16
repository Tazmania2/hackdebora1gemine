angular.module('funifierApp').factory('RewardsService', function($http, $q, FUNIFIER_API_CONFIG, AuthService) {
    var service = {};

    service.getRewardsCatalog = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/rewards', {
            headers: {
                'Authorization': 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ=='
            }
        });
    };

    service.getRewardDetails = function(rewardId) {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/rewards/' + rewardId, {
            headers: {
                'Authorization': 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ=='
            }
        });
    };

    service.redeemReward = function(rewardId) {
        return $http.post(FUNIFIER_API_CONFIG.baseUrl + '/rewards/' + rewardId + '/redeem', {}, {
            headers: {
                'Authorization': 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ=='
            }
        });
    };

    service.getRedeemedRewards = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/rewards/redeemed', {
            headers: {
                'Authorization': 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ=='
            }
        });
    };

    service.getRewardHistory = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/rewards/history', {
            headers: {
                'Authorization': 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ=='
            }
        });
    };

    return service;
}); 