// Controller responsável pela homepage (dados do jogador)
angular.module('interstellarApp')
  .controller('HomepageController', ['$scope', '$http', '$location', function($scope, $http, $location) {
    $scope.loading = true;
    $scope.player = {};
    $scope.status = {};
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "../html/index.html";
      return;
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
        $scope.loading = false;
        $scope.getStatus();
      },
      function(error) {
        console.error("Erro ao carregar dados:", error);
        window.location.href = "../html/index.html";
      }
    );

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
          console.log('Resposta da API:', response.data);
          const data = response.data;
          $scope.status = data;
          $scope.loading = false;
        },
        function(error) {
          console.error("Erro ao carregar dados:", error);
          window.location.href = "../html/index.html";
        }
      );
    };

    $scope.logout = function() {
      localStorage.removeItem("token");
      window.location.href = "../html/index.html";
    };
  }]);