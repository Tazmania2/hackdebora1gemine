angular.module('funifierApp').controller('WelcomeController', function($timeout, $location) {
    var vm = this;
    // Wait 4 seconds, then go to dashboard
    $timeout(function() {
        $location.path('/dashboard');
    }, 4000);
}); 