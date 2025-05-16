// Controller responsável pelas pesquisas/quizzes
angular.module('interstellarApp')
  .controller('QuizController', ['$scope', '$location', function($scope, $location) {
    // Implemente a lógica dos quizzes aqui

    // Funções de navegação para a barra inferior
    $scope.goToHome = function() { $location.path('/home'); };
    $scope.goToDashboard = function() { $location.path('/dashboard'); };
    $scope.goToEventos = function() { $location.path('/eventos'); };
    $scope.goToPesquisas = function() { $location.path('/quiz'); };
    $scope.goToCursos = function() { $location.path('/courses'); };
    $scope.goToComunidade = function() { $location.path('/comunidade'); };
  }]);
