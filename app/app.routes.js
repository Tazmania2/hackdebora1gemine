angular.module('app')
  .config(['$routeProvider','$locationProvider', function($routeProvider,$locationProvider) {
    // Optional: enable HTML5 mode
    // $locationProvider.html5Mode(true);
    $routeProvider
      .when('/', {
        templateUrl: 'app/views/home.html',
        controller:  'HomeController'
      })
      .otherwise({ redirectTo: '/' });
  }]); 