angular.module('funifierApp').controller('RegisterController', function($scope, $http, $location, AuthService, FUNIFIER_API_CONFIG) {
    var vm = this;
    vm.loading = false;
    vm.error = null;

    vm.register = function() {
        if (vm.registerForm.$invalid) {
            return;
        }

        vm.loading = true;
        vm.error = null;

        // Criar o payload do jogador
        var playerData = {
            name: vm.name,
            email: vm.email,
            password: vm.password,
            extra: {
                register: true
            }
        };

        // Fazer a requisição diretamente com o Basic auth token
        $http({
            method: 'POST',
            url: 'https://service2.funifier.com/v3/player',
            headers: {
                'Authorization': AuthService.getBasicAuthToken(),
                'Content-Type': 'application/json'
            },
            data: playerData
        }).then(function(response) {
            console.log('Registration successful:', response.data);
            // Armazenar dados do jogador e redirecionar para o dashboard
            AuthService.storePlayerData(response.data);
            $location.path('/dashboard');
        }).catch(function(error) {
            console.error('Registration error:', error);
            vm.error = error.data && error.data.message ? error.data.message : 'Erro ao registrar jogador.';
        }).finally(function() {
            vm.loading = false;
        });
    };
}); 