// Deprecated: All routes are now defined in app.js

angular.module('app')
  .config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    console.log('[app.routes.js] config block executed');
    // keep hashbang mode since you're using "#!/..."
    $locationProvider.html5Mode(false);

    $routeProvider
      // Redirect root URL to /login
      .when('/', {
        redirectTo: '/login'
      })
      .when('/login', {
        templateUrl: 'app/views/login/loginView.html',
        controller:  'LoginController',
        controllerAs: 'vm'
      })
      .when('/register', {
        templateUrl: 'app/views/register/registerView.html',
        controller:  'RegisterController',
        controllerAs: 'vm'
      })
      .when('/dashboard', {
        templateUrl: 'app/views/dashboard/dashboardView.html',
        controller:  'DashboardController',
        controllerAs: 'vm'
      })
      .when('/profile', {
        templateUrl: 'app/views/profile/profileView.html',
        controller:  'ProfileController',
        controllerAs: 'vm'
      })
      .when('/rewards', {
        templateUrl: 'app/views/rewards/rewardsView.html',
        controller:  'RewardsController',
        controllerAs: 'vm'
      })
      .when('/virtual-goods', {
        templateUrl: 'app/views/virtual-goods/virtualGoodsView.html',
        controller:  'VirtualGoodsController',
        controllerAs: 'vm'
      })
      .when('/terms', {
        templateUrl: 'app/views/terms/termsView.html'
      })
      .otherwise({ redirectTo: '/login' });
  }]);