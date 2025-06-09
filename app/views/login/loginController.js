// app/views/login/loginController.js
angular.module('app').controller('LoginController', function($scope, $location, AuthService, FUNIFIER_API_CONFIG, ThemeConfigService) {
    var vm = this; // vm (ViewModel) é uma prática comum para 'this' em controladores

    vm.loading = false;
    vm.error = null;
    vm.user = {
        email: '',
        password: ''
    };
    vm.themeLogo = null;
    vm.showStudioLogo = true;

    // Load logo and showStudioLogo from theme config
    ThemeConfigService.getConfig().then(function(cfg) {
        vm.themeLogo = cfg.logo || null;
        vm.showStudioLogo = (typeof cfg.showStudioLogo === 'undefined') ? true : !!cfg.showStudioLogo;
        $scope.$applyAsync();
    });
    // Listen for logo updates
    $scope.$on('theme-logo-updated', function(e, logo) {
        vm.themeLogo = logo;
        $scope.$applyAsync();
    });

    vm.resetEmail = '';
    vm.resetMessage = '';
    vm.isRequestingReset = false;
    vm.resetSuccess = false;

    vm.login = function() {
        if (!vm.user.email || !vm.user.password) {
            vm.error = 'Por favor, preencha email e senha.';
            return;
        }

        vm.loading = true;
        vm.error = '';

        AuthService.login(vm.user.email, vm.user.password)
            .then(function(response) {
                vm.loading = false;
                $location.path('/dashboard');
            })
            .catch(function(error) {
                vm.loading = false;
                vm.error = typeof error === 'string' ? error : 'Erro ao fazer login. Tente novamente.';
            });
    };

    vm.requestPasswordReset = function() {
        if (!vm.resetEmail) {
            vm.resetMessage = 'Por favor, informe seu email.';
            return;
        }

        AuthService.requestPasswordResetCode(vm.resetEmail)
            .then(function() {
                vm.resetMessage = 'Código de recuperação enviado para seu email.';
            })
            .catch(function(error) {
                vm.resetMessage = 'Erro ao enviar código de recuperação.';
            });
    };

    vm.goToRegister = function() {
        $location.path('/register');
    };

    // Initialize controller
    function init() {
        // Check if user is already logged in
        if (AuthService.getCurrentPlayer()) {
            $location.path('/dashboard');
        }
    }

    init();
});