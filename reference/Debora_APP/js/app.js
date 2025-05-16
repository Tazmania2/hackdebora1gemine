// Módulo principal AngularJS com rotas para cada controller/página
angular.module('interstellarApp', ['ngRoute', 'ngSanitize'])
  .run(['$rootScope', function($rootScope) {
    $rootScope.isLoggedIn = function() {
      var token = !!localStorage.getItem('token');
      var path = window.location.hash || '';
      // Oculta barra se rota for login ou cadastro
      if (path.indexOf('/login') !== -1 || path.indexOf('/signup') !== -1) {
        return false;
      }
      return token;
    };

  }])
// Componente da barra de navegação
// (carregado automaticamente pelo script bottomNav.component.js)

  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/login', {
        templateUrl: 'html/login.html',
        controller: 'LoginController'
      })
      .when('/home', {
        templateUrl: 'html/homepage.html',
        controller: 'HomepageController'
      })
      .when('/quiz', {
        templateUrl: 'html/quiz.html',
        controller: 'QuizController'
      })
      .when('/store', {
        templateUrl: 'html/store.html',
        controller: 'StoreController'
      })
      .when('/eventos', {
        templateUrl: 'html/events.html',
        controller: 'EventsController'
      })
      .when('/courses', {
        templateUrl: 'html/courses.html',
        controller: 'CoursesController'
      })
      .when('/comunidade', {
        templateUrl: 'html/comunidade.html',
        controller: 'ComunidadeController'
      })
      .when('/leaderboard', {
        templateUrl: 'html/leaderboard.html',
        controller: 'LeaderboardController'
      })
      .when('/challenges', {
        templateUrl: 'html/challenges.html',
        controller: 'ChallengesController'
      })
      .when('/dashboard', {
        templateUrl: 'html/dashboard.html',
        controller: 'DashboardController'
      })
      .otherwise({
        redirectTo: '/login'
      });
  }]);