angular.module('funifierApp').controller('RegisterController', function($location, AuthService) {
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

        // Implement registration logic here
        console.log('Registering user:', vm.user);
        // For now, just redirect to login
        $location.path('/login');
    };
}); 