angular.module('funifierApp').controller('ProfileController', function($scope, $http, $location, AuthService, FUNIFIER_API_CONFIG, PlayerService) {
    var vm = this;
    vm.loading = false;
    vm.error = null;
    vm.success = null;
    vm.profile = AuthService.getCurrentPlayer() || {};
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
        var baseUrl = window.location.origin + window.location.pathname;
        vm.referralUrl = baseUrl + '#!/register?referral=' + vm.profile._id;
        generateQRCode();
    }

    vm.updateProfile = function() {
        vm.loading = true;
        vm.error = null;
        vm.success = null;

        $http({
            method: 'PUT',
            url: FUNIFIER_API_CONFIG.baseUrl + '/player/' + vm.profile._id + '/status',
            headers: {
                'Authorization': AuthService.getBasicAuthToken(),
                'Content-Type': 'application/json'
            },
            data: {
                name: vm.profile.name,
                extra: vm.profile.extra
            }
        }).then(function(response) {
            vm.success = 'Perfil atualizado com sucesso!';
            AuthService.storePlayerData(response.data);
        }).catch(function(error) {
            console.error('Profile update error:', error);
            vm.error = error.data && error.data.message ? error.data.message : 'Erro ao atualizar perfil.';
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

    // Initialize referral URL and QR code
    updateReferralUrl();
}); 