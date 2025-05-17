angular.module('funifierApp').factory('PlayerService', function($http, $q, FUNIFIER_API_CONFIG, AuthService) {
    var service = {};

    service.getPlayerProfile = function() {
        return $http({
            method: 'GET',
            url: FUNIFIER_API_CONFIG.baseUrl + '/player/me',
            headers: {
                'Authorization': localStorage.getItem('token'),
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            // Store the player data for later use
            localStorage.setItem('currentPlayer', JSON.stringify(response.data));
            return response;
        });
    };

    service.updatePlayerProfile = function(updateData) {
        var currentPlayer = service.getCurrentPlayer();
        if (!currentPlayer || !currentPlayer._id) {
            return $q.reject('Player ID not found');
        }
        // Only send the fields to update (name and extra)
        var payload = {};
        if (updateData.name) payload.name = updateData.name;
        if (updateData.extra) payload.extra = updateData.extra;
        return $http({
            method: 'PUT',
            url: FUNIFIER_API_CONFIG.baseUrl + '/player/' + currentPlayer._id + '/status',
            headers: {
                'Authorization': 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==',
                'Content-Type': 'application/json'
            },
            data: payload
        }).then(function(response) {
            // Update stored player data
            var updatedPlayer = angular.copy(currentPlayer);
            if (payload.name) updatedPlayer.name = payload.name;
            if (payload.extra) updatedPlayer.extra = payload.extra;
            localStorage.setItem('currentPlayer', JSON.stringify(updatedPlayer));
            return { data: updatedPlayer };
        });
    };

    service.getPlayerBalance = function() {
        return $http({
            method: 'GET',
            url: FUNIFIER_API_CONFIG.baseUrl + '/player/me/status',
            headers: {
                'Authorization': localStorage.getItem('token'),
                'Content-Type': 'application/json'
            }
        });
    };

    service.getPlayerActivities = function() {
        return $http({
            method: 'GET',
            url: FUNIFIER_API_CONFIG.baseUrl + '/player/me/activity',
            headers: {
                'Authorization': localStorage.getItem('token'),
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            // If no activities found, return empty array instead of error
            if (response.data && response.data.errorCode === 404) {
                return { data: [] };
            }
            return response;
        });
    };

    service.getPlayerRewards = function() {
        return $http({
            method: 'GET',
            url: FUNIFIER_API_CONFIG.baseUrl + '/player/me/rewards',
            headers: {
                'Authorization': localStorage.getItem('token'),
                'Content-Type': 'application/json'
            }
        });
    };

    service.getPlayerEvents = function() {
        return $http({
            method: 'GET',
            url: FUNIFIER_API_CONFIG.baseUrl + '/player/me/events',
            headers: {
                'Authorization': localStorage.getItem('token'),
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            // If no events found, return empty array instead of error
            if (response.data && response.data.errorCode === 404) {
                return { data: [] };
            }
            return response;
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
                'Authorization': localStorage.getItem('token'),
                'Content-Type': 'application/json'
            },
            data: purchaseData
        });
    };

    service.shareOnSocial = function(platform, proof) {
        return $http({
            method: 'POST',
            url: FUNIFIER_API_CONFIG.baseUrl + '/player/me/share',
            headers: {
                'Authorization': localStorage.getItem('token'),
                'Content-Type': 'application/json'
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
                'Authorization': localStorage.getItem('token'),
                'Content-Type': 'application/json'
            },
            data: answers
        });
    };

    service.recreatePlayer = function(playerData) {
        // Use Fetch API to bypass AngularJS interceptors and force Basic Auth
        return $q(function(resolve, reject) {
            fetch(FUNIFIER_API_CONFIG.baseUrl + '/player', {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(playerData)
            })
            .then(response => response.json().then(data => ({
                status: response.status,
                data: data
            })))
            .then(result => {
                if (result.status >= 200 && result.status < 300) {
                    resolve({ data: result.data });
                } else {
                    reject({ status: result.status, data: result.data });
                }
            })
            .catch(error => reject({ status: 0, data: error }));
        });
    };

    service.getStatus = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/player/status');
    };

    service.getProfile = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/player/profile');
    };

    service.updateProfile = function(profileData) {
        return $http.put(FUNIFIER_API_CONFIG.baseUrl + '/player/profile', profileData);
    };

    service.getBalance = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/player/balance');
    };

    service.getActivities = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/player/activities');
    };

    service.getEvents = function() {
        return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/player/events');
    };

    return service;
}); 