// Novo controller para Leaderboard
angular.module('interstellarApp')
  .controller('LeaderboardController', ['$scope', '$http', function($scope, $http) {
    // IDs fixos dos leaderboards
    const PERSONAL_ID = 'ETFEnEe';
    const TEAM_ID = 'ETFEsDW';

    $scope.currentRanking = 'personal';
    $scope.leaderboard = [];
    $scope.loading = false;
    $scope.error = '';
    $scope.sortOrder = 'desc';

    // Token
    let token = localStorage.getItem("token");
    if (token && !token.startsWith("Bearer ")) {
      token = "Bearer " + token;
      localStorage.setItem("token", token);
    }
    if (!token) {
      window.location.href = "../html/index.html";
      return;
    }

    // Troca entre ranking pessoal/equipe
    $scope.showRanking = function(type) {
      $scope.currentRanking = type;
      $scope.leaderboard = [];
      $scope.loading = true;
      $scope.error = '';
      let rankingId = type === 'personal' ? PERSONAL_ID : TEAM_ID;
      $http({
        method: 'POST',
        url: `https://service2.funifier.com/v3/leaderboard/${rankingId}/leader/aggregate?period=&live=true`,
        headers: { "Authorization": token, "Content-Type": "application/json" },
        data: []
      }).then(function(resp) {
        const data = resp.data;
        if (Array.isArray(data) && data.length > 0) {
          $scope.leaderboard = data.map(p => ({
            name: p.name || p.player || 'Jogador',
            image: p.image ? p.image : '../img/default-avatar.png',
            total: p.total || 0,
            position: p.position || null
          }));
        } else {
          $scope.error = 'Nenhum dado de ranking encontrado.';
          console.warn('[Leaderboard] Resposta vazia para ranking', type, data);
        }
        $scope.loading = false;
        $scope.$applyAsync();
      }, function() {
        $scope.error = 'Erro ao buscar ranking.';
        $scope.loading = false;
        $scope.$applyAsync();
      });
    };

    // Ordenação
    $scope.toggleSort = function() {
      $scope.sortOrder = $scope.sortOrder === 'desc' ? 'asc' : 'desc';
      $scope.sortLeaderboard();
    };
    $scope.sortLeaderboard = function() {
      if (!$scope.leaderboard) return;
      $scope.leaderboard.sort(function(a, b) {
        var valA = a.total || 0;
        var valB = b.total || 0;
        if ($scope.sortOrder === 'desc') return valB - valA;
        return valA - valB;
      });
    };

    // Inicialização automática
    $scope.showRanking('personal');
  }]);
