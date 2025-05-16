angular.module('funifierApp').factory('AdminService', function($http, $q, FUNIFIER_API_CONFIG) {
    var service = {};

    service.getProgramRules = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/admin/rules', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    service.updateProgramRules = function(rules) {
        return $http.put(FUNIFIER_API_CONFIG.baseUrl + '/admin/rules', rules, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    service.getRewardsCatalog = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/admin/rewards', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    service.addReward = function(reward) {
        return $http.post(FUNIFIER_API_CONFIG.baseUrl + '/admin/rewards', reward, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    service.updateReward = function(rewardId, reward) {
        return $http.put(FUNIFIER_API_CONFIG.baseUrl + '/admin/rewards/' + rewardId, reward, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    service.deleteReward = function(rewardId) {
        return $http.delete(FUNIFIER_API_CONFIG.baseUrl + '/admin/rewards/' + rewardId, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    service.getProgramStats = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/admin/stats', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    service.getActivePlayers = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/admin/players/active', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    service.getPlayerDetails = function(playerId) {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/admin/players/' + playerId, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    service.updateProgramSettings = function(settings) {
        return $http.put(FUNIFIER_API_CONFIG.baseUrl + '/admin/settings', settings, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    service.getCustomFields = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/admin/fields', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    service.updateCustomFields = function(fields) {
        return $http.put(FUNIFIER_API_CONFIG.baseUrl + '/admin/fields', fields, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('funifierAuthToken')
            }
        });
    };

    return service;
}); 