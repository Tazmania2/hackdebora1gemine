angular.module('app').controller('RegisterController', function($scope, $http, $location, $routeParams, $rootScope, AuthService, FUNIFIER_API_CONFIG) {
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
        vm.user.referralCode = $routeParams.referral; // Pre-fill the input
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

        // Step 1: Fetch all players to ensure unique mycode
        $http({
            method: 'GET',
            url: FUNIFIER_API_CONFIG.baseUrl + '/player',
            headers: {
                'Authorization': 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==',
                'Content-Type': 'application/json'
            }
        }).then(function(allPlayersRes) {
            var allPlayers = allPlayersRes.data || [];
            // Helper to generate random code
            function randomCode(length) {
                var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                var code = '';
                for (var i = 0; i < length; i++) {
                    code += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return code;
            }
            // Find all existing mycodes
            var existingCodes = new Set();
            allPlayers.forEach(function(p) {
                if (p.extra && p.extra.mycode) existingCodes.add(p.extra.mycode);
            });
            // Generate unique code
            var mycode;
            do {
                mycode = randomCode(7);
            } while (existingCodes.has(mycode));

            // Criar o payload do jogador no formato correto
            var playerData = {
                _id: vm.user.email.toLowerCase().trim(),
                name: vm.user.name,
                email: vm.user.email.toLowerCase().trim(),
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
                    phone: vm.user.phone,
                    cpf: vm.user.cpf,
                    birthdate: vm.user.birthdate,
                    cep: "",
                    referredBy: vm.user.referralCode || vm.referralId || null,
                    mycode: mycode,
                    termsAccepted: true,
                    termsAcceptedDate: new Date().toISOString(),
                    register: true
                }
            };

            // Step 2: Register the player
            $http({
                method: 'POST',
                url: FUNIFIER_API_CONFIG.baseUrl + '/player',
                headers: {
                    'Authorization': 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==',
                    'Content-Type': 'application/json'
                },
                data: playerData
            }).then(function(response) {
                // Step 3: Assign the 'Player' role
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
                    // Step 4: Referral logic
                    var referralCode = playerData.extra.referredBy;
                    if (referralCode) {
                        // Find the player with this mycode
                        var referredPlayer = allPlayers.find(function(p) {
                            return p.extra && p.extra.mycode === referralCode;
                        });
                        if (referredPlayer && referredPlayer._id) {
                            // Trigger action log for 'convidar'
                            $http({
                                method: 'POST',
                                url: FUNIFIER_API_CONFIG.baseUrl + '/action/log',
                                headers: {
                                    'Authorization': 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==',
                                    'Content-Type': 'application/json'
                                },
                                data: {
                                    actionId: 'convidar',
                                    userId: referredPlayer._id,
                                    attributes: {
                                        referred: playerData._id
                                    }
                                }
                            }).then(function() {
                                // Continue to login
                                AuthService.login(playerData.email, playerData.password)
                                    .then(function() {
                                        $location.path('/dashboard');
                                    })
                                    .catch(function(error) {
                                        vm.error = 'Erro ao fazer login automático. Por favor, faça login manualmente.';
                                    });
                            }, function() {
                                // Even if action log fails, continue
                                AuthService.login(playerData.email, playerData.password)
                                    .then(function() {
                                        $location.path('/dashboard');
                                    })
                                    .catch(function(error) {
                                        vm.error = 'Erro ao fazer login automático. Por favor, faça login manualmente.';
                                    });
                            });
                            return;
                        }
                    }
                    // No referral or not found, just login
                    AuthService.login(playerData.email, playerData.password)
                        .then(function() {
                            $location.path('/dashboard');
                        })
                        .catch(function(error) {
                            vm.error = 'Erro ao fazer login automático. Por favor, faça login manualmente.';
                        });
                }).catch(function(error) {
                    vm.error = 'Erro ao atribuir papel ao jogador.';
                });
            }).catch(function(error) {
                vm.error = error.data && error.data.message ? error.data.message : 'Erro ao registrar jogador.';
            }).finally(function() {
                vm.loading = false;
            });
        }).catch(function(error) {
            vm.error = 'Erro ao buscar jogadores para gerar código único.';
            vm.loading = false;
        });
    };
}); 