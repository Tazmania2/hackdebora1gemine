angular.module('funifierApp').controller('DashboardController', function($scope, $location, PlayerService, AuthService) {
    var vm = this;

    vm.player = {};
    vm.balance = {};
    vm.activities = [];
    vm.events = [];

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
    }

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