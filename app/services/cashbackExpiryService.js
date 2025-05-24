(function() {
  'use strict';
  angular.module('app').factory('CashbackExpiryService', CashbackExpiryService);
  CashbackExpiryService.$inject = ['$http', '$q', 'PlayerService'];
  function CashbackExpiryService($http, $q, PlayerService) {
    var basicAuth = 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==';
    var apiUrl = 'https://service2.funifier.com/v3/database/achievement';
    var service = {
      expireOldCashback: expireOldCashback
    };
    return service;

    /**
     * Expires cashback achievements older than 90 days for the given player
     * @param {string} playerName
     * @returns {Promise}
     */
    function expireOldCashback(playerName) {
      var now = Date.now();
      var ninetyDays = 90 * 24 * 60 * 60 * 1000;
      // 1. Fetch cashback achievements for the player (Basic Auth)
      var query = encodeURIComponent(JSON.stringify({ player: playerName, item: 'cashback' }));
      return $http.get(apiUrl + '?q=' + query, {
        headers: { 'Authorization': basicAuth, 'Content-Type': 'application/json' }
      }).then(function(response) {
        var achievements = response.data || [];
        var expired = achievements.filter(function(a) {
          return now - a.time > ninetyDays;
        });
        console.log('[CashbackExpiryService] Expired cashback achievements:', expired);
        // 2. For each expired cashback achievement:
        var actions = expired.map(function(a) {
          // a) Log 'expired_cashback' achievement (Basic Auth)
          var logExpired = $http.post(apiUrl, {
            player: playerName,
            item: 'expired_cashback',
            time: now,
            type: 0,
            total: a.total,
            extra: { original_achievement_id: a._id }
          }, {
            headers: { 'Authorization': basicAuth, 'Content-Type': 'application/json' }
          });
          // b) Delete the old cashback achievement (Basic Auth)
          var deleteOld = $http.delete(apiUrl + '?q=' + encodeURIComponent("_id:'" + a._id + "'"), {
            headers: { 'Authorization': basicAuth, 'Content-Type': 'application/json' }
          });
          return $q.all([logExpired, deleteOld]);
        });
        // 3. Refresh player status after all actions
        return $q.all(actions).then(function() {
          return PlayerService.getStatus();
        });
      });
    }
  }
})(); 