// app/app.js
(function() {
    'use strict';

    angular
        .module('app', [
            'ngRoute',
            'ngAnimate',
            'ngSanitize',
            'ngMessages',
            'ui.bootstrap',
            'angular-loading-bar',
            'ui.select'
        ])
        .config(config)
        .run(run);

    config.$inject = ['$routeProvider', '$locationProvider', '$httpProvider', 'cfpLoadingBarProvider'];

    function config($routeProvider, $locationProvider, $httpProvider, cfpLoadingBarProvider) {
        console.log('[app.js] config block executed');
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
            .when('/events', {
                templateUrl: 'app/views/events/eventsView.html',
                controller: 'EventsController',
                controllerAs: 'vm',
                resolve: {
                    auth: ['AuthService', function(AuthService) {
                        return AuthService.isAuthenticated();
                    }]
                }
            })
            .when('/store', {
                templateUrl: 'app/views/store/storeView.html',
                controller: 'StoreController',
                controllerAs: 'vm',
                resolve: {
                    auth: ['AuthService', function(AuthService) {
                        return AuthService.isAuthenticated();
                    }]
                }
            })
            .when('/social', {
                templateUrl: 'app/views/social/socialView.html',
                controller: 'SocialController',
                controllerAs: 'vm',
                resolve: {
                    auth: ['AuthService', function(AuthService) {
                        return AuthService.isAuthenticated();
                    }]
                }
            })
            .when('/history', {
                templateUrl: 'app/views/history/historyView.html',
                controller: 'HistoryController',
                controllerAs: 'vm',
                resolve: {
                    auth: ['AuthService', function(AuthService) {
                        return AuthService.isAuthenticated();
                    }]
                }
            })
            .when('/quiz', {
                templateUrl: 'app/views/quiz/quizView.html',
                controller: 'QuizController',
                controllerAs: 'vm',
                resolve: {
                    auth: ['AuthService', function(AuthService) {
                        return AuthService.isAuthenticated();
                    }]
                }
            })
            .when('/quiz/:quizId', {
                templateUrl: 'app/views/quiz/quizView.html',
                controller: 'QuizController',
                controllerAs: 'vm',
                resolve: {
                    auth: ['AuthService', function(AuthService) {
                        return AuthService.isAuthenticated();
                    }]
                }
            })
            .when('/register-purchase', {
                templateUrl: 'app/views/purchase/registerPurchaseView.html',
                controller: 'RegisterPurchaseController',
                controllerAs: 'vm',
                resolve: {
                    auth: ['AuthService', function(AuthService) {
                        return AuthService.isAuthenticated();
                    }]
                }
            })
            .when('/fidelidade', {
                templateUrl: 'app/views/fidelidade/fidelidadeView.html',
                controller: 'FidelidadeController',
                controllerAs: 'vm',
                resolve: {
                    auth: ['AuthService', function(AuthService) {
                        return AuthService.isAuthenticated();
                    }]
                }
            })
            .when('/cashback-coupon', {
                templateUrl: 'app/views/virtual-goods/cashbackCouponView.html',
                controller: 'CashbackCouponController',
                controllerAs: 'vm',
                resolve: {
                    auth: ['AuthService', function(AuthService) {
                        return AuthService.isAuthenticated();
                    }]
                }
            })
            .otherwise({ redirectTo: '/login' });

        $locationProvider.html5Mode(true);

        // Configure loading bar
        cfpLoadingBarProvider.includeSpinner = false;
        cfpLoadingBarProvider.latencyThreshold = 100;

        // Add auth interceptor
        $httpProvider.interceptors.push('AuthInterceptor');
    }

    run.$inject = ['$rootScope', '$location', 'AuthService', '$log', 'ThemeConfigService'];

    function run($rootScope, $location, AuthService, $log, ThemeConfigService) {
        $log = $log || console;
        $log.debug && $log.debug('[app.js] run block executed');
        // Apply theme config from Funifier
        ThemeConfigService.getConfig().then(function(cfg) {
            ThemeConfigService.applyConfig(cfg);
        });
        // Handle route change errors
        $rootScope.$on('$routeChangeError', function(event, current, previous, rejection) {
            console.error('[RouteChangeError]', { event, current, previous, rejection });
            if (rejection === 'not_authenticated') {
                $location.path('/login');
            }
        });
        // Handle 401 responses
        $rootScope.$on('unauthorized', function() {
            AuthService.logout();
            $location.path('/login');
        });
    }
})();