angular.module('funifierApp').controller('RegisterController', function($scope, $http, $location, $routeParams, $rootScope, AuthService, FUNIFIER_API_CONFIG) {
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
            _id: vm.user.email.toLowerCase().trim(), // Using full email as ID, ensuring lowercase and no spaces
            name: vm.user.name,
            email: vm.user.email.toLowerCase().trim(), // Also ensuring email is lowercase and trimmed
            password: vm.user.password, // Password will be hashed by Funifier's trigger
            image: {
                small: { url: "https://my.funifier.com/images/funny.png" },
                medium: { url: "https://my.funifier.com/images/funny.png" },
                original: { url: "https://my.funifier.com/images/funny.png" }
            },
            teams: [],
            friends: [],
            extra: {
                country: "Brasil",
                phone: vm.user.phone,
                cpf: vm.user.cpf,
                birthdate: vm.user.birthdate,
                cep: "",
                referredBy: vm.user.referralCode || vm.referralId || null,
                termsAccepted: true,
                termsAcceptedDate: new Date().toISOString(),
                register: true // This will trigger the password hashing
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
            // Assign the 'Player' role in the principal collection
            $http({
                method: 'PUT',
                url: FUNIFIER_API_CONFIG.baseUrl + '/database/principal',
                headers: {
                    'Authorization': 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==',
                    'Content-Type': 'application/json'
                },
                data: {
                    _id: playerData._id,
                    valueId: playerData._id,
                    roles: ['Player'],
                    name: playerData.name,
                    team: false,
                    type: 0,
                    userId: playerData._id,
                    player: true
                }
            }).then(function(response) {
                console.log('Role assignment successful:', response.data);
                // Automatic login after registration and role assignment
                AuthService.login(playerData.email, playerData.password)
                    .then(function() {
                        $location.path('/dashboard');
                    })
                    .catch(function(error) {
                        console.error('Automatic login failed:', error);
                        vm.error = 'Erro ao fazer login automático. Por favor, faça login manualmente.';
                    });
            }).catch(function(error) {
                console.error('Role assignment error:', error);
                vm.error = 'Erro ao atribuir papel ao jogador.';
            });
        }).catch(function(error) {
            console.error('Registration error:', error);
            vm.error = error.data && error.data.message ? error.data.message : 'Erro ao registrar jogador.';
        }).finally(function() {
            vm.loading = false;
        });
    };
}); 