angular.module('funifierApp').controller('WelcomeController', function($timeout, $location, $rootScope, AuthService) {
    console.log('[WelcomeController] Loaded');
    console.log('[WelcomeController] Email:', $rootScope.newPlayerEmail, 'Password:', $rootScope.newPlayerPassword);
    var vm = this;
    vm.status = 'Preparando seu perfil...';
    vm.error = null;

    console.log('[WelcomeController] Starting $timeout for login attempt...');
    // Wait 2 seconds, then try to login as the new player
    $timeout(function() {
        console.log('[WelcomeController] $timeout fired');
        if (!$rootScope.newPlayerEmail || !$rootScope.newPlayerPassword) {
            console.error('[WelcomeController] No credentials found in $rootScope');
            vm.error = 'Erro ao fazer login automático. Por favor, faça login manualmente.';
            $timeout(function() {
                console.log('[WelcomeController] Redirecting to /login due to missing credentials');
                $location.path('/login');
            }, 2000);
            return;
        }

        vm.status = 'Fazendo login...';
        console.log('[WelcomeController] Attempting automatic login for:', $rootScope.newPlayerEmail);
        
        AuthService.login($rootScope.newPlayerEmail, $rootScope.newPlayerPassword)
            .then(function() {
                console.log('[WelcomeController] Automatic login successful');
                vm.status = 'Login realizado com sucesso!';
                $timeout(function() {
                    console.log('[WelcomeController] Redirecting to /dashboard after successful login');
                    $location.path('/dashboard');
                }, 1000);
            })
            .catch(function(error) {
                console.error('[WelcomeController] Automatic login failed:', error);
                vm.error = 'Erro ao fazer login automático. Por favor, faça login manualmente.';
                $timeout(function() {
                    console.log('[WelcomeController] Redirecting to /login after failed login');
                    $location.path('/login');
                }, 2000);
            });
    }, 2000);
}); 