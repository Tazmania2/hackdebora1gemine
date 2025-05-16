// Controller global para navegação SPA na barra inferior
// Corrigido: goToEventos agora usa $location.path('/eventos') para navegação SPA
angular.module('interstellarApp')
  .controller('NavController', ['$scope', '$location', function($scope, $location) {
    $scope.isActive = function(path) {
      return $location.path().indexOf(path) === 0;
    };

    $scope.goToHome = function() { $location.path('/home'); };
    $scope.goToCursos = function() { $location.path('/courses'); };
    $scope.goToDashboard = function() { $location.path('/dashboard'); };
    $scope.goToEventos = function() { $location.path('/eventos'); };
    $scope.goToPesquisas = function() { $location.path('/quiz'); };
    $scope.goToDesafios = function() { $location.path('/challenges'); };
    $scope.goToComunidade = function() { $location.path('/comunidade'); };
    $scope.goToLeaderboard = function() { $location.path('/leaderboard'); };
    $scope.goToStore = function() { $location.path('/store'); };
    $scope.goToLogout = function() {
      localStorage.removeItem("token");
      $location.path('/login');
    };
  }]);
