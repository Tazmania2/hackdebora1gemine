angular.module('funifierApp').controller('RegisterController', function($scope, $http, $location, $routeParams, AuthService, FUNIFIER_API_CONFIG) {
    var vm = this;
    vm.loading = false;
    vm.error = null;
    vm.user = {
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    };

    // Check for referral in URL
    if ($routeParams.referral) {
        vm.referralId = $routeParams.referral;
    }

    vm.register = function() {
        if (vm.user.password !== vm.user.confirmPassword) {
            vm.error = 'As senhas não coincidem.';
            return;
        }

        vm.loading = true;
        vm.error = null;

        // Criar o payload do jogador no formato correto
        var playerData = {
            _id: vm.user.email,
            name: vm.user.name,
            email: vm.user.email,
            image: {
                small: { url: "https://my.funifier.com/images/funny.png" },
                medium: { url: "https://my.funifier.com/images/funny.png" },
                original: { url: "https://my.funifier.com/images/funny.png" }
            },
            teams: [],
            friends: [],
            extra: {
                country: "Brasil",
                company: "Funifier User",
                sports: ["soccer"],
                phone: "",
                cpf: "",
                cep: "",
                referredBy: vm.referralId || null
            }
        };

        // Fazer a requisição com Basic Auth
        $http({
            method: 'POST',
            url: FUNIFIER_API_CONFIG.baseUrl + '/player',
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