angular.module('funifierApp').controller('DashboardController', function($scope, $location, PlayerService, AuthService) {
    var vm = this;

    vm.player = {};
    vm.status = {};
    vm.activities = [];
    vm.events = [];
    vm.currentToken = localStorage.getItem('token');
    vm.loading = true;
    vm.error = null;
    vm.updating = false;
    vm.editedProfile = {};

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
                vm.status = response.data;
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

    vm.openProfileModal = function() {
        // Create a deep copy of the player data to avoid direct modifications
        vm.editedProfile = angular.copy(vm.player);
        if (!vm.editedProfile.extra) {
            vm.editedProfile.extra = {};
        }
        $('#profileModal').modal('show');
    };

    vm.updateProfile = function() {
        vm.updating = true;
        vm.error = null;

        // Ensure we don't modify critical fields
        var updateData = {
            name: vm.editedProfile.name,
            extra: vm.editedProfile.extra
        };

        PlayerService.updatePlayerProfile(updateData)
            .then(function(response) {
                // Update the local player data
                vm.player = response.data;
                // Close the modal
                $('#profileModal').modal('hide');
                // Show success message
                alert('Perfil atualizado com sucesso!');
            })
            .catch(function(error) {
                console.error('Error updating profile:', error);
                vm.error = 'Erro ao atualizar perfil. Por favor, tente novamente.';
            })
            .finally(function() {
                vm.updating = false;
            });
    };

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