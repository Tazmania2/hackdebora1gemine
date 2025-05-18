// app/views/login/loginController.js
angular.module('app').controller('LoginController', function($scope, $location, AuthService, FUNIFIER_API_CONFIG) {
    var vm = this; // vm (ViewModel) é uma prática comum para 'this' em controladores

    vm.loading = false;
    vm.error = null;
    vm.user = {
        email: '',
        password: ''
    };

    vm.resetEmail = '';
    vm.resetMessage = '';
    vm.isRequestingReset = false;
    vm.resetSuccess = false;

    vm.login = function() {
        console.log('login called');
        if (!vm.user.email || !vm.user.password) {
            vm.error = 'Por favor, preencha todos os campos.';
            return;
        }

        vm.loading = true;
        vm.error = null;

        AuthService.login(vm.user.email, vm.user.password)
            .then(function() {
                $location.path('/dashboard');
            })
            .catch(function(error) {
                console.error('Login error:', error);
                vm.error = error.data && error.data.message ? error.data.message : 'Erro ao fazer login.';
            })
            .finally(function() {
                vm.loading = false;
            });
    };

    vm.requestPasswordReset = function() {
        vm.resetMessage = '';
        vm.isRequestingReset = true;
        vm.resetSuccess = false;

        AuthService.requestPasswordResetCode(vm.resetEmail)
            .then(function(response) {
                if (response.status >= 200 && response.status < 300) {
                    vm.resetMessage = "Se o email estiver cadastrado, um código de reset foi enviado.";
                    vm.resetSuccess = true;
                } else {
                    vm.resetMessage = "Resposta inesperada do servidor: Status " + response.status;
                    vm.resetSuccess = false;
                }
            })
            .catch(function(error) {
                vm.resetSuccess = false;
                if (error.data && (error.data.message || error.data.error)) {
                    vm.resetMessage = "Erro: " + (error.data.message || error.data.error);
                } else if (error.status === 404) {
                    vm.resetMessage = "Usuário não encontrado com este email.";
                } else if (error.statusText) {
                    vm.resetMessage = "Erro: " + error.statusText;
                } else {
                    vm.resetMessage = "Erro ao solicitar o código de reset. Tente novamente.";
                }
            })
            .finally(function() {
                vm.isRequestingReset = false;
            });
    };
});