// app/app.js
var app = angular.module('funifierApp', ['ngRoute']);

// Constante para configuração da API
// ATENÇÃO: O apiSecret NUNCA deve ser exposto no lado do cliente em produção.
// Esta abordagem é apenas para prototipagem inicial e assume que a chamada /auth/basic
// será protegida por um proxy/backend em um ambiente real.
app.constant('FUNIFIER_API_CONFIG', {
    baseUrl: 'https://service2.funifier.com/v3', // URL base da API Funifier v3
    apiKey: '68252a212327f74f3a3d100d',
    appSecret: '682605f62327f74f3a3d248e', // AppSecret do Funifier Studio
    passwordResetBaseUrl: 'https://service2.funifier.com/v3' // Para o endpoint de reset de senha
});

app.config(function($routeProvider, $locationProvider) {
    $routeProvider
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
        .when('/dashboard', {
            templateUrl: 'views/dashboard/dashboardView.html',
            controller: 'DashboardController',
            controllerAs: 'vm',
            resolve: {
                auth: function($location, AuthService) {
                    if (!AuthService.isAuthenticated()) {
                        $location.path('/login');
                    }
                }
            }
        })
        .when('/rewards', {
            templateUrl: 'views/rewards/rewardsView.html',
            controller: 'RewardsController',
            controllerAs: 'vm',
            resolve: {
                auth: function($location, AuthService) {
                    if (!AuthService.isAuthenticated()) {
                        $location.path('/login');
                    }
                }
            }
        })
        .when('/purchase', {
            templateUrl: 'views/purchase/purchaseView.html',
            controller: 'PurchaseController',
            controllerAs: 'vm',
            resolve: {
                auth: function($location, AuthService) {
                    if (!AuthService.isAuthenticated()) {
                        $location.path('/login');
                    }
                }
            }
        })
        .otherwise({
            redirectTo: '/login'
        });

    // Disable HTML5 mode to use hash-based URLs
    $locationProvider.html5Mode(false);
});

app.run(function($rootScope, $location, AuthService) {
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
        if (next && next.originalPath && 
            next.originalPath !== '/login' && 
            next.originalPath !== '/register') {
            if (!AuthService.isAuthenticated()) {
                event.preventDefault();
                $location.path('/login');
            }
        }
    });
});