(function() {
  'use strict';
  angular.module('app').factory('CashbackExpiryService', CashbackExpiryService);
  CashbackExpiryService.$inject = ['$http', '$q', 'PlayerService', 'ActivityService'];
  function CashbackExpiryService($http, $q, PlayerService, ActivityService) {
    var basicAuth = 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==';
    var apiUrl = 'https://service2.funifier.com/v3/database/achievement';
    var service = {
      expireOldCashback: expireOldCashback,
      expireOldCashbackForPlayer: expireOldCashbackForPlayer
    };
    return service;

    /**
     * Expires cashback achievements older than 90 days for the given player (or current player if not provided)
     * @param {string} [playerId] - Optional playerId to run expiry for
     * @returns {Promise}
     */
    function expireOldCashback(playerId) {
      // Fetch expiry days from Funifier
      var expiryConfigUrl = 'https://service2.funifier.com/v3/database/cashback_expiry_config__c?q=_id:\'cashback_expiry_days\'';
      return $http.get(expiryConfigUrl, { headers: { Authorization: basicAuth } }).then(function(cfgResp) {
        var days = 90;
        if (cfgResp.data && cfgResp.data[0] && cfgResp.data[0].days) {
          days = cfgResp.data[0].days;
        }
        var now = Date.now();
        var expiryMs = days * 24 * 60 * 60 * 1000;
        // 1. Get player status to find the player ID
        var getPlayerStatus = playerId ?
          $http.get('https://service2.funifier.com/v3/player/' + encodeURIComponent(playerId) + '/status', { headers: { Authorization: basicAuth } }) :
          PlayerService.getStatus();
        return getPlayerStatus.then(function(statusRes) {
          var playerIdResolved = statusRes.data && (statusRes.data._id || statusRes.data.player || statusRes.data.id);
          if (!playerIdResolved) {
            return $q.reject('Player ID not found in status');
          }
          var aggregateBody = [
            { "$match": { player: playerIdResolved, item: "cashback" } }
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
              return now - timeMs > expiryMs;
            });
            console.log('[CashbackExpiryService] Expired cashback achievements:', expired);
            var fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
            var expiringSoon = achievements.filter(function(a) {
              var timeMs = (typeof a.time === 'object' && a.time.$date)
                ? new Date(a.time.$date).getTime()
                : a.time;
              return now - timeMs > (expiryMs - fiveDaysMs) && now - timeMs < expiryMs;
            });
            if (expiringSoon.length) {
              // Fetch player profile for phone
              $http.get('https://service2.funifier.com/v3/player/' + encodeURIComponent(playerIdResolved), { headers: { Authorization: basicAuth } }).then(function(resp) {
                var player = resp.data;
                var phone = player.extra && player.extra.phone;
                if (phone) {
                  phone = phone.replace(/\D/g, '');
                  if (!phone.startsWith('55')) phone = '55' + phone;
                  phone = '+' + phone;
                  expiringSoon.forEach(function() {
                    ActivityService.sendSmsNotification(phone, 'Seus pontos/cashback vão expirar em 5 dias!');
                  });
                }
              });
            }
            // 2. For each expired cashback achievement:
            var actions = expired.map(function(a) {
              // a) Log 'expired_cashback' achievement (Basic Auth)
              var logExpired = $http.post(apiUrl, {
                player: playerIdResolved,
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
              return playerId ?
                $http.get('https://service2.funifier.com/v3/player/' + encodeURIComponent(playerIdResolved) + '/status', { headers: { Authorization: basicAuth } }) :
                PlayerService.getStatus();
            });
          });
        });
      });
    }

    function expireOldCashbackForPlayer(playerId) {
      return expireOldCashback(playerId);
    }
  }
})(); 