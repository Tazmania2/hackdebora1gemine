angular.module('funifierApp').controller('RegisterController', function($location, $http, AuthService, PlayerService, FUNIFIER_API_CONFIG) {
    var vm = this;

    vm.user = {
        email: '',
        password: '',
        confirmPassword: '',
        name: ''
    };
    vm.errorMessage = '';
    vm.isLoading = false;

    vm.register = function() {
        vm.errorMessage = '';
        vm.isLoading = true;

        if (vm.user.password !== vm.user.confirmPassword) {
            vm.errorMessage = 'As senhas não coincidem.';
            vm.isLoading = false;
            return;
        }

        // First get API token
        AuthService.getApiToken()
            .then(function(apiToken) {
                // Then register the player using the correct endpoint and payload structure
                return $http.post('https://service2.funifier.com/v3/player', {
                    _id: vm.user.email, // Using email as the unique identifier
                    name: vm.user.name,
                    email: vm.user.email,
                    password: vm.user.password
                }, {
                    headers: {
                        'Authorization': 'Bearer ' + apiToken,
                        'Content-Type': 'application/json'
                    }
                });
            })
            .then(function(response) {
                if (response.data && response.data._id) {
                    // Registration successful, redirect to login
                    $location.path('/login');
                } else {
                    throw new Error('Resposta inválida do servidor');
                }
            })
            .catch(function(error) {
                if (error.data && error.data.message) {
                    vm.errorMessage = error.data.message;
                } else if (error.data && error.data.error) {
                    vm.errorMessage = error.data.error;
                } else if (typeof error === 'string') {
                    vm.errorMessage = error;
                } else {
                    vm.errorMessage = 'Erro ao registrar. Por favor, tente novamente.';
                }
                console.error('Registration error:', error);
            })
            .finally(function() {
                vm.isLoading = false;
            });
    };
}); 