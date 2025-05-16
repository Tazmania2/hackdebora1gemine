// Controller responsável pela loja/recompensas
angular.module('interstellarApp')
  .controller('StoreController', ['$scope', '$location', '$http', function($scope, $location, $http) {
    // Implemente a lógica da loja aqui
    $scope.loading = true;
    $scope.items = [];
    let token = localStorage.getItem("token");
    if (token && !token.startsWith("Bearer ")) {
      token = "Bearer " + token;
      localStorage.setItem("token", token);
    }
    
    $http({
      method: 'GET',
      url: 'https://service2.funifier.com/v3/player/me',
      headers: {
        "Authorization": token,
        "Content-Type": "application/json"
      }
    }).then(
      function(response) {
        console.log('Resposta da API:', response.data);
        const data = response.data;
        $scope.player = data;
        // Após obter o player, buscar o status (moedas disponíveis)
        $scope.fetchPlayerStatus();
        $scope.loading = false;
      },
      function(error) {
        console.error("Erro ao carregar dados:", error);
        window.location.href = "../html/index.html";
      }
    );  

    // Buscar itens da loja
    $scope.fetchStoreItems = function() {
      $http({
        method: 'GET',
        url: 'https://service2.funifier.com/v3/virtualgoods/item',
        headers: {
          "Authorization": token,
          "Content-Type": "application/json"
        }
      }).then(
        function(response) {
          $scope.items = response.data;
          $scope.loading = false;
        },
        function(error) {
          $scope.loading = false;
          $scope.error = 'Erro ao carregar itens da loja.';
        }
      );
    };
    $scope.fetchStoreItems();

    // Função para saber se o jogador pode resgatar o item
    $scope.canRedeem = function(item, player) {
      if (!item.requires || item.requires.length === 0) return true;
      if (!player || !player.point_categories) return false;
      let can = true;
      item.requires.forEach(function(req) {
        if (req.item === 'coins') {
          if ((player.point_categories.coins || 0) < req.total) can = false;
        } else if (req.item === 'xp' || req.item === 'point') {
          if ((player.point_categories.point || 0) < req.total) can = false;
        }
      });
      return can;
    };

    // Função para buscar o status do jogador (moedas, xp, etc)
    $scope.fetchPlayerStatus = function() {
      if (!$scope.player || !$scope.player._id) return;
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
        },
        function(error) {
          $scope.status = {};
          console.error("Erro ao carregar status:", error);
        }
      );
    };

    // Função para efetuar o resgate de um item
    $scope.redeemItem = function(item) {
      const token = localStorage.getItem("token");
      $scope.rescueLoading = item._id; // Para loading individual
      $http({
        method: 'POST',
        url: 'https://service2.funifier.com/v3/virtualgoods/purchase',
        headers: {
          "Authorization": token,
          "Content-Type": "application/json"
        },
        data: {
          player: "me",
          item: item._id,
          total: 1
        }
      }).then(
        function(response) {
          $scope.rescueLoading = null;
          // Atualizar player, status e itens após resgate
          console.log('Resposta da API:', response.data);
          $scope.fetchStoreItems();
          $scope.fetchPlayerStatus();
          alert('Resgate realizado com sucesso!');
        },
        function(error) {
          $scope.rescueLoading = null;
          if (error.data && error.data.message) {
            alert('Erro ao resgatar: ' + error.data.message);
          } else {
            alert('Erro ao resgatar item.');
          }
        }
      );
    };

    // Funções de navegação para a barra inferior
    $scope.goToHome = function() { $location.path('/home'); };
    $scope.goToLeaderboard = function() { $location.path('/leaderboard'); };
    $scope.goToChallenges = function() { $location.path('/challenges'); };
    $scope.goToDashboard = function() { $location.path('/dashboard'); };
    $scope.goToEventos = function() { $location.path('/eventos'); };
    $scope.goToPesquisas = function() { $location.path('/quiz'); };
    $scope.goToCursos = function() { $location.path('/courses'); };
    $scope.goToComunidade = function() { $location.path('/comunidade'); };
    $scope.goToStore = function() { $location.path('/store'); };
    $scope.goToLogout = function() {
      localStorage.removeItem("token");
      $location.path('/login');
    };
  }]);
