angular.module('funifierApp').controller('RegisterController', function($scope, $http, $location, $routeParams, AuthService, FUNIFIER_API_CONFIG) {
    var vm = this;
    vm.loading = false;
    vm.error = null;
    vm.showingTerms = false;
    vm.showingRegulation = false;
    vm.user = {
        name: '',
        email: '',
        phone: '',
        birthdate: '',
        cpf: '',
        password: '',
        confirmPassword: '',
        referralCode: '',
        acceptTerms: false
    };

    // Check for referral in URL
    if ($routeParams.referral) {
        vm.referralId = $routeParams.referral;
    }

    vm.showTerms = function(event) {
        event.preventDefault();
        vm.showingTerms = true;
        vm.showingRegulation = false;
        $('#termsModal').modal('show');
    };

    vm.showRegulation = function(event) {
        event.preventDefault();
        vm.showingTerms = false;
        vm.showingRegulation = true;
        $('#termsModal').modal('show');
    };

    vm.acceptTerms = function() {
        vm.user.acceptTerms = true;
    };

    vm.register = function() {
        if (vm.user.password !== vm.user.confirmPassword) {
            vm.error = 'As senhas não coincidem.';
            return;
        }

        if (!vm.user.acceptTerms) {
            vm.error = 'Você precisa aceitar os Termos de Uso e Regulamento para continuar.';
            return;
        }

        vm.loading = true;
        vm.error = null;

        // Criar o payload do jogador no formato correto
        var playerData = {
            _id: vm.user.email.split('@')[0], // Usando email como ID
            name: vm.user.name,
            email: vm.user.email,
            password: vm.user.password,
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
                phone: vm.user.phone,
                cpf: vm.user.cpf,
                birthdate: vm.user.birthdate,
                cep: "",
                referredBy: vm.user.referralCode || vm.referralId || null,
                termsAccepted: true,
                termsAcceptedDate: new Date().toISOString()
            }
        };

        // Fazer a requisição com o token de autenticação
        $http({
            method: 'POST',
            url: FUNIFIER_API_CONFIG.baseUrl + '/player',
            headers: {
                'Authorization': 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==',
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