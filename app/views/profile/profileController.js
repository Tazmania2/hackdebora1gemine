angular.module('funifierApp').controller('ProfileController', function($scope, $http, $location, AuthService, FUNIFIER_API_CONFIG, PlayerService) {
    var vm = this;
    vm.loading = false;
    vm.error = null;
    vm.success = null;
    vm.editedProfile = {};
    vm.referralUrl = '';
    vm.currentToken = localStorage.getItem('token');

    // Initialize QR code
    function generateQRCode() {
        var qr = qrcode(0, 'M');
        qr.addData(vm.referralUrl);
        qr.make();
        document.getElementById('qrcode').innerHTML = qr.createImgTag(5);
    }

    // Generate referral URL
    function updateReferralUrl() {
        if (!vm.editedProfile || !vm.editedProfile._id) {
            vm.error = 'Perfil não encontrado. Por favor, faça login novamente.';
            return;
        }

        var baseUrl = window.location.origin + window.location.pathname;
        vm.referralUrl = baseUrl + '#!/register?referral=' + vm.editedProfile._id;
        generateQRCode();
    }

    // Generate referral code
    function generateReferralCode() {
        if (!vm.editedProfile || !vm.editedProfile._id) {
            vm.error = 'Perfil não encontrado. Por favor, faça login novamente.';
            return;
        }

        vm.loading = true;
        PlayerService.generateReferralCode()
            .then(function(response) {
                console.log('Referral code generated:', response.data);
                vm.success = 'Código de indicação gerado com sucesso!';
                updateReferralUrl();
            })
            .catch(function(error) {
                console.error('Error generating referral code:', error);
                vm.error = error.data && error.data.message ? error.data.message : 'Erro ao gerar código de indicação.';
            })
            .finally(function() {
                vm.loading = false;
            });
    }

    // Load player data
    function loadProfile() {
        vm.loading = true;
        PlayerService.getPlayerProfile().then(function(response) {
            vm.editedProfile = angular.copy(response.data);
            if (!vm.editedProfile.extra) {
                vm.editedProfile.extra = {};
            }
        }).catch(function(error) {
            console.error('Error loading profile:', error);
            vm.error = 'Erro ao carregar perfil. Por favor, tente novamente.';
        }).finally(function() {
            vm.loading = false;
        });
    }

    // Update profile
    vm.updateProfile = function() {
        vm.loading = true;
        vm.error = null;
        vm.success = null;
        
        // Create update data object
        var updateData = {
            name: vm.editedProfile.name,
            extra: vm.editedProfile.extra
        };

        PlayerService.updatePlayerProfile(updateData).then(function(response) {
            vm.success = 'Perfil atualizado com sucesso!';
            // Update the local player data
            AuthService.storePlayerData(response.data);
            generateReferralCode(); // Generate referral code after profile update
        }).catch(function(error) {
            console.error('Error updating profile:', error);
            vm.error = 'Erro ao atualizar perfil. Por favor, tente novamente.';
        }).finally(function() {
            vm.loading = false;
        });
    };

    vm.copyReferralLink = function() {
        var tempInput = document.createElement('input');
        tempInput.value = vm.referralUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        vm.success = 'Link copiado com sucesso!';
    };

    vm.copyToken = function() {
        navigator.clipboard.writeText(vm.currentToken).then(function() {
            vm.success = 'Token copiado para a área de transferência!';
            setTimeout(function() {
                vm.success = null;
                $scope.$apply();
            }, 3000);
        });
    };

    // Navigate back
    vm.goBack = function() {
        $location.path('/dashboard');
    };

    // Load profile data when controller initializes
    loadProfile();
}); 