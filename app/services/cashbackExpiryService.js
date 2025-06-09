(function() {
  'use strict';
  angular.module('app').factory('CashbackExpiryService', CashbackExpiryService);
  CashbackExpiryService.$inject = ['$http', '$q', 'PlayerService', 'ActivityService'];
  function CashbackExpiryService($http, $q, PlayerService, ActivityService) {
    var basicAuth = 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==';
    var apiUrl = 'https://service2.funifier.com/v3/database/achievement';
    var service = {
      expireOldCashback: expireOldCashback,
      expireOldCashbackForPlayer: expireOldCashbackForPlayer,
      getDaysToCashbackExpiry: getDaysToCashbackExpiry
    };
    return service;

    /**
     * Expires cashback achievements older than 90 days for the given player (or current player if not provided)
     * @param {string} [playerId] - Optional playerId to run expiry for
     * @returns {Promise}
     */
    function expireOldCashback(playerId) {
      if (!playerId) {
        return $q.reject('Player ID is required');
      }

      // First, get all cashback achievements for this player
      return service.getExpiredCashbackAchievements(playerId)
        .then(function(expiredAchievements) {
          if (!expiredAchievements || expiredAchievements.length === 0) {
            return { message: 'No expired cashback found', expired: [] };
          }

          // Process each expired achievement
          var promises = expiredAchievements.map(function(achievement) {
            return service.processExpiredAchievement(achievement);
          });

          return $q.all(promises).then(function(results) {
            return {
              message: 'Expired cashback processed successfully',
              expired: expiredAchievements,
              results: results
            };
          });
        })
        .catch(function(error) {
          return $q.reject('Error processing expired cashback: ' + error);
        });
    }

    // Get expired cashback achievements for a player
    function getExpiredCashbackAchievements(playerId) {
      // Calculate expiry date (90 days ago)
      var expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() - 90);
      var expiryIsoString = expiryDate.toISOString();

      var query = {
        '$and': [
          { 'player': playerId },
          { 'points.category': 'cashback' },
          { 'points.total': { '$gt': 0 } },
          { 'date': { '$lt': expiryIsoString } }
        ]
      };

      return $http({
        method: 'POST',
        url: apiUrl + '/aggregate?strict=true',
        headers: {
          'Authorization': localStorage.getItem('token'),
          'Content-Type': 'application/json'
        },
        data: [{
          '$match': query
        }]
      }).then(function(response) {
        var expired = response.data || [];
        return expired;
      }).catch(function(error) {
        return $q.reject('Error fetching expired achievements: ' + error.message);
      });
    }

    // Process a single expired achievement
    function processExpiredAchievement(achievement) {
      if (!achievement || !achievement._id) {
        return $q.reject('Invalid achievement provided');
      }

      // Create log entry for expired cashback
      var logData = {
        type: 'cashback_expired',
        player: achievement.player,
        originalAchievement: achievement._id,
        expiredPoints: achievement.points,
        expiredAt: new Date().toISOString(),
        originalDate: achievement.date
      };

      var logExpired = $http.post(apiUrl, logData, {
        headers: {
          'Authorization': localStorage.getItem('token'),
          'Content-Type': 'application/json'
        }
      });

      // Remove the expired achievement
      var deleteOld = $http.delete(apiUrl + '?q=' + encodeURIComponent("_id:'" + achievement._id + "'"), {
        headers: {
          'Authorization': localStorage.getItem('token')
        }
      });

      return $q.all([logExpired, deleteOld]).then(function(results) {
        return {
          logged: results[0].data,
          deleted: results[1].data,
          achievementId: achievement._id
        };
      }).catch(function(error) {
        return $q.reject('Error processing achievement ' + achievement._id + ': ' + error.message);
      });
    }

    function expireOldCashbackForPlayer(playerId) {
      return expireOldCashback(playerId);
    }

    /**
     * Returns the minimum number of days left to expiry for the current player's cashback achievements
     * @returns {Promise<number|null>} Number of days left, or null if none found
     */
    function getDaysToCashbackExpiry() {
      // This would calculate based on the oldest unexpired cashback
      // For now, return a placeholder
      return $q.resolve(30); // 30 days as example
    }
  }
})(); 