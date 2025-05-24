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
     * Expires cashback achievements older than 90 days for the current player (by ID)
     * @returns {Promise}
     */
    function expireOldCashback() {
      var now = Date.now();
      var ninetyDays = 90 * 24 * 60 * 60 * 1000;
      // 1. Get player status to find the player ID
      return PlayerService.getStatus().then(function(statusRes) {
        var playerId = statusRes.data && (statusRes.data._id || statusRes.data.player || statusRes.data.id);
        if (!playerId) {
          return $q.reject('Player ID not found in status');
        }
        var aggregateBody = [
          { "$match": { player: playerId, item: "cashback" } }
        ];
        return $http({
          method: 'POST',
          url: apiUrl + '/aggregate?strict=true',
          headers: { 'Authorization': basicAuth, 'Content-Type': 'application/json' },
          data: aggregateBody
        }).then(function(response) {
          var achievements = response.data || [];
          var expired = achievements.filter(function(a) {
            var timeMs = (typeof a.time === 'object' && a.time.$date)
              ? new Date(a.time.$date).getTime()
              : a.time;
            return now - timeMs > ninetyDays;
          });
          console.log('[CashbackExpiryService] Expired cashback achievements:', expired);
          // 2. For each expired cashback achievement:
          var actions = expired.map(function(a) {
            // a) Log 'expired_cashback' achievement (Basic Auth)
            var logExpired = $http.post(apiUrl, {
              player: playerId,
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
      });
    }
  }
})(); 