angular.module('funifierApp').controller('DashboardController', function($scope, $location, PlayerService, AuthService) {
    var vm = this;

    vm.player = {};
    vm.balance = {};
    vm.activities = [];
    vm.events = [];
    vm.currentToken = localStorage.getItem('token');

    function loadDashboardData() {
        // Load player profile
        PlayerService.getPlayerProfile()
            .then(function(response) {
                vm.player = response.data;
                console.log('Player profile loaded:', response.data);
            })
            .catch(function(error) {
                console.error('Error loading player profile:', error);
            });

        // Load balance
        PlayerService.getPlayerBalance()
            .then(function(response) {
                vm.balance = response.data;
                console.log('Balance loaded:', response.data);
            })
            .catch(function(error) {
                console.error('Error loading balance:', error);
            });

        // Load activities
        PlayerService.getPlayerActivities()
            .then(function(response) {
                vm.activities = response.data;
                console.log('Activities loaded:', response.data);
            })
            .catch(function(error) {
                console.error('Error loading activities:', error);
            });

        // Load events
        PlayerService.getPlayerEvents()
            .then(function(response) {
                vm.events = response.data;
                console.log('Events loaded:', response.data);
            })
            .catch(function(error) {
                console.error('Error loading events:', error);
            });
    }

    vm.copyToken = function() {
        navigator.clipboard.writeText(vm.currentToken).then(function() {
            alert('Token copiado para a área de transferência!');
        });
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