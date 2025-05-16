angular.module('FP03W03', [])
  .controller('FP03W03', ['$scope', '$http', function ($scope, $http) {
    $scope.statusList = [];
    $scope.players = [];
    $scope.selectedPlayerId = null;
    $scope.loading = false;
    $scope.error = null;
    $scope.customConfig = {};

    var AUTH_HEADER = Funifier.auth.getAuthorization();

    var CONFIG_URL = Funifier.config.service + '/v3/database/funpack01__c?strict=true&q=_id:\'global\'';
    var PLAYER_URL = Funifier.config.service + '/v3/player';
    var STATUS_URL = Funifier.config.service + '/v3/player/status'; 

    function applyCustomStyle(config) {
      var container = document.querySelector('#FP03W03 .status-container');
      if (!container) return;

      if (config.background_color) {
        container.style.backgroundColor = config.background_color;
      }

      if (config.border_color) {
        container.style.border = '3px solid ' + config.border_color;
      }

      if (config.font_color) {
        container.querySelectorAll('*').forEach(function (el) {
          el.style.color = config.font_color;
        });
      }

      if (config.font) {
        var formattedFont = config.font.replace(/ /g, '+');
        var linkId = 'dynamic-font-link-status';
        var existingLink = document.getElementById(linkId);

        if (existingLink) {
          existingLink.href = 'https://fonts.googleapis.com/css?family=' + formattedFont;
        } else {
          var link = document.createElement('link');
          link.id = linkId;
          link.rel = 'stylesheet';
          link.href = 'https://fonts.googleapis.com/css?family=' + formattedFont;
          document.head.appendChild(link);
        }

        container.style.fontFamily = config.font + ', Arial, sans-serif';
      }

      if (config.logo) {
        if (!document.querySelector('#FP03W03 .status-logo')) {
          var img = document.createElement('img');
          img.src = config.logo;
          img.alt = 'Logo';
          img.className = 'status-logo';
          img.style.display = 'block';
          img.style.maxWidth = '200px';
          img.style.margin = '0 auto 20px';
          container.insertBefore(img, container.firstChild);
        }
      }

      $scope.customConfig = config;
    }

    function loadConfig() {
      $http({
        method: 'GET',
        url: CONFIG_URL,
        headers: {
          "Authorization": AUTH_HEADER,
          "Content-Type": "application/json"
        }
      }).then(function (response) {
        if (response.data && response.data[0]) {
          applyCustomStyle(response.data[0]);
        }
      }, function (err) {
        console.error('Falha ao carregar configuração:', err);
      });
    }

    function loadPlayers() {
      $http({
        method: 'GET',
        url: PLAYER_URL,
        headers: {
          "Authorization": AUTH_HEADER,
          "Content-Type": "application/json"
        },
        data: {}
      }).then(function (response) {
        $scope.players = response.data || [];
        if ($scope.players.length > 0) {
          $scope.selectedPlayerId = $scope.players[0]._id;
          //$scope.loadStatus();
        }
      }, function (err) {
        console.error('Erro ao carregar jogadores:', err);
      });
    }
	
	$scope.loadPlayerInfo = function () {
      if (!$scope.selectedPlayer) return;
      const playerId = $scope.selectedPlayer._id;
	  const PLAYER_DETAIL_URL = Funifier.config.service + '/v3/player/' + playerId + '/status';

      $http({ method: 'GET', url: PLAYER_DETAIL_URL, headers: { 'Authorization': AUTH_HEADER } })
        .then(response => {
          const player = response.data;
          $scope.playerInfo = {
            name: player.name,
            photo: player.photo || 'https://via.placeholder.com/100',
            points: player.points || 0,
            challengesCompleted: Object.values(player.challenges).reduce((sum, value) => sum + value, 0) || 0,
            xp: player.level_progress.percent_completed || 0
          };
        });
    };

    $scope.loadStatus = function () {
      if (!$scope.selectedPlayerId) return;

      $scope.loading = true;
      $scope.error = null;

      $http({
        method: 'POST',
        url: STATUS_URL,
        headers: {
          'Authorization': AUTH_HEADER,
          'Content-Type': 'application/json'
        },
        data: [
          { "$match": { "player_id": $scope.selectedPlayerId } },
          { "$sort": { "updated_at": -1 } }
        ]
      }).then(function (response) {
        $scope.statusList = response.data || [];
        $scope.loading = false;
      }, function (err) {
        $scope.loading = false;
        $scope.error = "Erro ao carregar status.";
        console.error(err);
      });
    };

    // 2. Requisição para buscar todos os desafios
    var req = {
    method: 'GET',
    url: 'https://service2.funifier.com/v3/challenge',
    headers: {
        "Authorization": "Bearer SEU_TOKEN_AQUI",
        "Content-Type": "application/json"
    }
    };

    $http(req).then(
    function (response) {
        var allChallenges = response.data;

        // 3. Filtra os desafios do usuário com base no ID
        var userChallenges = allChallenges.filter(function (challenge) {
        return userChallengeProgress.hasOwnProperty(challenge._id);
        });

        // 4. Mapeia para exibir nome, imagem e progresso
        $scope.challengeList = userChallenges.map(function (challenge) {
        return {
            id: challenge._id,
            name: challenge.challenge,
            description: challenge.description,
            badge: challenge.badge?.small?.url || '',
            progress: userChallengeProgress[challenge._id] || 0
        };
        });
    },
    function (err) {
        console.error("Erro ao buscar desafios:", err);
    }
    );
    
    loadConfig();
    loadPlayers();
  }]);




setTimeout(function () {
  var element = angular.element(document.getElementById('FP03W03'));
  if (!element.injector()) {
    angular.bootstrap(element, ['FP03W03']);
  }
}, 10);