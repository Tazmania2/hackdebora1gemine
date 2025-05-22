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
            'angular-loading-bar'
        ])
        .config(config)
        .run(run);

    config.$inject = ['$routeProvider', '$locationProvider', '$httpProvider', 'cfpLoadingBarProvider'];

    function config($routeProvider, $locationProvider, $httpProvider, cfpLoadingBarProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'views/dashboard/dashboardView.html',
                controller: 'DashboardController',
                controllerAs: 'vm',
                resolve: {
                    auth: ['AuthService', function(AuthService) {
                        return AuthService.isAuthenticated();
                    }]
                }
            })
            .when('/login', {
                templateUrl: 'views/login/loginView.html',
                controller: 'LoginController',
                controllerAs: 'vm'
            })
            .when('/register', {
                templateUrl: 'views/register/registerView.html',
                controller: 'RegisterController',
                controllerAs: 'vm'
            })
            .when('/profile', {
                templateUrl: 'views/profile/profileView.html',
                controller: 'ProfileController',
                controllerAs: 'vm',
                resolve: {
                    auth: ['AuthService', function(AuthService) {
                        return AuthService.isAuthenticated();
                    }]
                }
            })
            .when('/rewards', {
                templateUrl: 'views/rewards/rewardsView.html',
                controller: 'RewardsController',
                controllerAs: 'vm',
                resolve: {
                    auth: ['AuthService', function(AuthService) {
                        return AuthService.isAuthenticated();
                    }]
                }
            })
            .when('/virtual-goods', {
                templateUrl: 'views/virtual-goods/virtualGoodsView.html',
                controller: 'VirtualGoodsController',
                controllerAs: 'vm',
                resolve: {
                    auth: ['AuthService', function(AuthService) {
                        return AuthService.isAuthenticated();
                    }]
                }
            })
            .when('/events', {
                templateUrl: 'views/events/eventsView.html',
                controller: 'EventsController',
                controllerAs: 'vm',
                resolve: {
                    auth: ['AuthService', function(AuthService) {
                        return AuthService.isAuthenticated();
                    }]
                }
            })
            .when('/store', {
                templateUrl: 'views/store/storeView.html',
                controller: 'StoreController',
                controllerAs: 'vm',
                resolve: {
                    auth: ['AuthService', function(AuthService) {
                        return AuthService.isAuthenticated();
                    }]
                }
            })
            .when('/social', {
                templateUrl: 'views/social/socialView.html',
                controller: 'SocialController',
                controllerAs: 'vm',
                resolve: {
                    auth: ['AuthService', function(AuthService) {
                        return AuthService.isAuthenticated();
                    }]
                }
            })
            .when('/history', {
                templateUrl: 'views/history/historyView.html',
                controller: 'HistoryController',
                controllerAs: 'vm',
                resolve: {
                    auth: ['AuthService', function(AuthService) {
                        return AuthService.isAuthenticated();
                    }]
                }
            })
            .when('/quiz', {
                templateUrl: 'views/quiz/quizView.html',
                controller: 'QuizController',
                controllerAs: 'vm',
                resolve: {
                    auth: ['AuthService', function(AuthService) {
                        return AuthService.isAuthenticated();
                    }]
                }
            })
            .when('/register-purchase', {
                templateUrl: 'views/purchase/registerPurchaseView.html',
                controller: 'VirtualGoodsController',
                controllerAs: 'vm',
                resolve: {
                    auth: ['AuthService', function(AuthService) {
                        return AuthService.isAuthenticated();
                    }]
                }
            })
            .otherwise({
                redirectTo: '/'
            });

        $locationProvider.html5Mode(true);

        // Configure loading bar
        cfpLoadingBarProvider.includeSpinner = false;
        cfpLoadingBarProvider.latencyThreshold = 100;

        // Add auth interceptor
        $httpProvider.interceptors.push('AuthInterceptor');
    }

    run.$inject = ['$rootScope', '$location', 'AuthService'];

    function run($rootScope, $location, AuthService) {
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