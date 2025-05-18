angular.module('app')
  .config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    // keep hashbang mode since you're using "#!/..."
    $locationProvider.html5Mode(false);

    $routeProvider
      // Redirect root URL to /login
      .when('/', {
        redirectTo: '/login'
      })
      .when('/login', {
        templateUrl: 'app/views/login/loginView.html',
        controller:  'LoginController'
      })
      .when('/register', {
        templateUrl: 'app/views/register/registerView.html',
        controller:  'RegisterController'
      })
      .when('/dashboard', {
        templateUrl: 'app/views/dashboard/dashboardView.html',
        controller:  'DashboardController'
      })
      .when('/profile', {
        templateUrl: 'app/views/profile/profileView.html',
        controller:  'ProfileController'
      })
      .when('/rewards', {
        templateUrl: 'app/views/rewards/rewardsView.html',
        controller:  'RewardsController'
      })
      .when('/virtual-goods', {
        templateUrl: 'app/views/virtual-goods/virtualGoodsView.html',
        controller:  'VirtualGoodsController'
      })
      .otherwise({ redirectTo: '/login' });
  }]); 