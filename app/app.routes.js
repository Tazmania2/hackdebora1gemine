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
        templateUrl: 'app/views/login/login.html',
        controller:  'LoginController'
      })
      // .when('/', {
      //   templateUrl: 'app/views/home.html',
      //   controller:  'HomeController'
      // })
      // .when('/register', {
      //   templateUrl: 'app/views/register/register.html',
      //   controller:  'RegisterController'
      // })
      // .when('/dashboard', {
      //   templateUrl: 'app/views/dashboard/dashboard.html',
      //   controller:  'DashboardController'
      // })
      // .when('/profile', {
      //   templateUrl: 'app/views/profile/profile.html',
      //   controller:  'ProfileController'
      // })
      // .when('/rewards', {
      //   templateUrl: 'app/views/rewards/rewards.html',
      //   controller:  'RewardsController'
      // })
      // .when('/virtual-goods', {
      //   templateUrl: 'app/views/virtual-goods/virtualGoods.html',
      //   controller:  'VirtualGoodsController'
      // })
      .otherwise({ redirectTo: '/login' });
  }]); 