// app/views/login/loginController.js
angular.module('funifierApp').controller('LoginController', function($location, $http, AuthService, FUNIFIER_API_CONFIG) {
    var vm = this; // vm (ViewModel) é uma prática comum para 'this' em controladores

    vm.credentials = {
        email: '',
        password: ''
    };
    vm.errorMessage = '';
    vm.isLoading = false;

    vm.resetEmail = '';
    vm.resetMessage = '';
    vm.isRequestingReset = false;
    vm.resetSuccess = false;


    vm.login = function() {
        vm.errorMessage = '';
        vm.isLoading = true;

        if (vm.credentials.email && vm.credentials.password) {
            $http({
                method: 'POST',
                url: FUNIFIER_API_CONFIG.baseUrl + '/player/login',
                headers: {
                    'Authorization': AuthService.getBasicAuthToken(),
                    'Content-Type': 'application/json'
                },
                data: {
                    email: vm.credentials.email,
                    password: vm.credentials.password
                }
            }).then(function(response) {
                if (response.data) {
                    AuthService.storePlayerData(response.data);
                    $location.path('/dashboard');
                } else {
                    vm.errorMessage = 'Resposta inválida do servidor.';
                }
            }).catch(function(error) {
                if (error.data && error.data.message) {
                    vm.errorMessage = error.data.message;
                } else if (error.data && error.data.error) {
                    vm.errorMessage = error.data.error;
                } else if (typeof error === 'string') {
                    vm.errorMessage = error;
                } else {
                    vm.errorMessage = 'Falha no login. Verifique suas credenciais ou tente novamente.';
                }
            }).finally(function() {
                vm.isLoading = false;
            });
        } else {
            vm.errorMessage = 'Por favor, preencha email e senha.';
            vm.isLoading = false;
        }
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