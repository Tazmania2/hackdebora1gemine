angular.module('funifierApp').controller('WelcomeController', function($timeout, $location, $rootScope, AuthService) {
    var vm = this;
    // Wait 4 seconds, then try to login as the new player
    $timeout(function() {
        AuthService.login($rootScope.newPlayerEmail, $rootScope.newPlayerPassword)
            .then(function() {
                $location.path('/dashboard');
            })
            .catch(function() {
                $location.path('/login');
            });
    }, 4000);
}); 