angular.module('funifierApp').controller('DashboardController', function($scope, $location, PlayerService, AuthService) {
    var vm = this;

    vm.player = {};
    vm.playerStatus = {};
    vm.activities = [];
    vm.events = [];
    vm.loading = true;
    vm.error = null;

    function loadDashboardData() {
        vm.loading = true;
        vm.error = null;

        // First get player profile
        PlayerService.getPlayerProfile()
            .then(function(response) {
                vm.player = response.data;
                console.log('Player profile loaded:', response.data);
                
                // Then get player status
                return PlayerService.getPlayerBalance();
            })
            .then(function(response) {
                vm.playerStatus = response.data;
                console.log('Player status loaded:', response.data);
                
                // Then load activities
                return PlayerService.getPlayerActivities();
            })
            .then(function(response) {
                vm.activities = response.data;
                console.log('Activities loaded:', response.data);
                
                // Finally load events
                return PlayerService.getPlayerEvents();
            })
            .then(function(response) {
                vm.events = response.data;
                console.log('Events loaded:', response.data);
                vm.loading = false;
            })
            .catch(function(error) {
                console.error('Error loading dashboard data:', error);
                vm.error = 'Erro ao carregar dados do dashboard. Por favor, tente novamente.';
                vm.loading = false;
            });
    }

    // Navigate to profile page
    vm.goToProfile = function() {
        $location.path('/profile');
    };

    vm.registerForEvent = function(eventId) {
        // Implementation for event registration
    };

    vm.goToRewards = function() {
        $location.path('/rewards');
    };

    vm.goToPurchases = function() {
        $location.path('/purchases');
    };

    vm.shareOnSocial = function() {
        // Implementation for social sharing
    };

    // Load dashboard data when controller initializes
    loadDashboardData();
}); 