angular.module('funifierApp').controller('WelcomeController', function($timeout, $location, $rootScope, AuthService) {
    console.log('[WelcomeController] Loaded');
    console.log('[WelcomeController] Email:', $rootScope.newPlayerEmail, 'Password:', $rootScope.newPlayerPassword);
    var vm = this;
    vm.status = 'Preparando seu perfil...';
    vm.error = null;

    // Wait 2 seconds, then try to login as the new player
    $timeout(function() {
        if (!$rootScope.newPlayerEmail || !$rootScope.newPlayerPassword) {
            console.error('No credentials found in $rootScope');
            vm.error = 'Erro ao fazer login automático. Por favor, faça login manualmente.';
            $timeout(function() {
                $location.path('/login');
            }, 2000);
            return;
        }

        vm.status = 'Fazendo login...';
        console.log('Attempting automatic login for:', $rootScope.newPlayerEmail);
        
        AuthService.login($rootScope.newPlayerEmail, $rootScope.newPlayerPassword)
            .then(function() {
                console.log('Automatic login successful');
                vm.status = 'Login realizado com sucesso!';
                $timeout(function() {
                    $location.path('/dashboard');
                }, 1000);
            })
            .catch(function(error) {
                console.error('Automatic login failed:', error);
                vm.error = 'Erro ao fazer login automático. Por favor, faça login manualmente.';
                $timeout(function() {
                    $location.path('/login');
                }, 2000);
            });
    }, 2000);
}); 