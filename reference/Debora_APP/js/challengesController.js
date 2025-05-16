// Controller responsável pelos desafios
angular.module('interstellarApp')
  .controller('ChallengesController', ['$scope', '$http', '$location', function($scope, $http, $location) {
    $scope.challenges = [];
    $scope.loading = true;
    $scope.error = '';
    $scope.player = {};
    $scope.status = {};
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "../html/index.html";
      return;
    }

    // Buscar dados do jogador
    $http({
      method: 'GET',
      url: 'https://service2.funifier.com/v3/player/me',
      headers: {
        "Authorization": token,
        "Content-Type": "application/json"
      }
    }).then(
      function(response) {
        $scope.player = response.data;
        $scope.getStatus();
      },
      function(error) {
        $scope.error = 'Erro ao carregar dados do jogador.';
        $scope.loading = false;
      }
    );

    // Buscar status do jogador (desafios completos, etc)
    $scope.getStatus = function() {
      $http({
        method: 'GET',
        url: 'https://service2.funifier.com/v3/player/' + $scope.player._id + '/status',
        headers: {
          "Authorization": token,
          "Content-Type": "application/json"
        }
      }).then(
        function(response) {
          $scope.status = response.data;
          $scope.fetchChallenges();
        },
        function(error) {
          $scope.error = 'Erro ao carregar status do jogador.';
          $scope.loading = false;
        }
      );
    };

    // Buscar lista de desafios
    $scope.fetchChallenges = function() {
      $http({
        method: 'GET',
        url: 'https://service2.funifier.com/v3/challenge',
        headers: {
          "Authorization": token,
          "Content-Type": "application/json"
        }
      }).then(
        function(response) {
          // Correlacionar desafios com status do jogador
          const challenges = response.data;
          const completed = ($scope.status.completedChallenges || []);
          $scope.challenges = challenges.map(function(ch) {
            // Verifica se o desafio foi completado e quantas vezes
            let completion = completed.find(function(c) { return c.challengeId === ch._id; });
            return {
              _id: ch._id,
              name: ch.name,
              description: ch.description,
              icon: ch.badgeUrl || (ch.badge && ch.badge.small && ch.badge.small.url) || '',
              rewardPoints: ch.reward && ch.reward.points ? ch.reward.points : 0,
              completed: !!completion,
              completionCount: completion ? completion.count : 0
            };
          });
          $scope.loading = false;
        },
        function(error) {
          $scope.error = 'Erro ao carregar desafios.';
          $scope.loading = false;
        }
      );
    };

    // Funções de navegação para a barra inferior
    
    
    
    
    
    
  }]);
