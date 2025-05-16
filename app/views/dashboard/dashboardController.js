angular.module('funifierApp').controller('DashboardController', function($scope, $location, PlayerService, AuthService) {
    var vm = this;

    vm.player = {};
    vm.balance = {};
    vm.activities = [];
    vm.events = [];
    vm.referralCode = '';
    vm.qrCodeUrl = '';

    function loadDashboardData() {
        // Load player profile
        PlayerService.getPlayerProfile()
            .then(function(response) {
                vm.player = response.data;
            })
            .catch(function(error) {
                console.error('Error loading player profile:', error);
            });

        // Load balance
        PlayerService.getPlayerBalance()
            .then(function(response) {
                vm.balance = response.data;
            })
            .catch(function(error) {
                console.error('Error loading balance:', error);
            });

        // Load activities
        PlayerService.getPlayerActivities()
            .then(function(response) {
                vm.activities = response.data;
            })
            .catch(function(error) {
                console.error('Error loading activities:', error);
            });

        // Load events
        PlayerService.getPlayerEvents()
            .then(function(response) {
                vm.events = response.data;
            })
            .catch(function(error) {
                console.error('Error loading events:', error);
            });

        // Generate referral code if not exists
        PlayerService.generateReferralCode()
            .then(function(response) {
                vm.referralCode = response.data.code;
                vm.qrCodeUrl = response.data.qrCodeUrl;
            })
            .catch(function(error) {
                console.error('Error generating referral code:', error);
            });
    }

    vm.copyReferralCode = function() {
        var tempInput = document.createElement('input');
        tempInput.value = vm.referralCode;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        // Show success message
        alert('Código copiado com sucesso!');
    };

    vm.registerForEvent = function(event) {
        // Implement event registration
        console.log('Registering for event:', event);
    };

    vm.goToRewards = function() {
        $location.path('/rewards');
    };

    vm.registerPurchase = function() {
        $location.path('/purchase');
    };

    vm.shareOnSocial = function() {
        // Implement social sharing
        console.log('Sharing on social media');
    };

    // Load dashboard data when controller initializes
    loadDashboardData();
}); 