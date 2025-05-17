angular.module('funifierApp').controller('ProfileController', function($scope, $http, $location, AuthService, FUNIFIER_API_CONFIG, PlayerService) {
    var vm = this;
    vm.loading = false;
    vm.error = null;
    vm.success = null;
    vm.editedProfile = {};

    // Load player data
    function loadProfile() {
        vm.loading = true;
        vm.error = null;
        
        PlayerService.getPlayerProfile().then(function(response) {
            // Create a deep copy of the profile data
            vm.editedProfile = angular.copy(response.data);
            // Ensure extra object exists
            if (!vm.editedProfile.extra) {
                vm.editedProfile.extra = {};
            }
            // Fix date format for input type="date"
            if (vm.editedProfile.extra.birthdate) {
                vm.editedProfile.extra.birthdate = new Date(vm.editedProfile.extra.birthdate);
            }
            // Initialize empty arrays/objects if they don't exist
            if (!vm.editedProfile.extra.sports) {
                vm.editedProfile.extra.sports = [];
            }
        }).catch(function(error) {
            console.error('Error loading profile:', error);
            vm.error = 'Erro ao carregar perfil. Por favor, tente novamente.';
        }).finally(function() {
            vm.loading = false;
        });
    }

    // Update profile (recreate player)
    vm.updateProfile = function() {
        vm.loading = true;
        vm.error = null;
        vm.success = null;
        // Convert birthdate to yyyy-MM-dd string if it's a Date object
        if (vm.editedProfile.extra.birthdate instanceof Date) {
            var d = vm.editedProfile.extra.birthdate;
            vm.editedProfile.extra.birthdate = d.toISOString().substring(0, 10);
        }
        // Build playerData with all required fields
        var playerData = {
            _id: vm.editedProfile._id,
            name: vm.editedProfile.name,
            email: vm.editedProfile.email,
            extra: vm.editedProfile.extra
        };
        PlayerService.recreatePlayer(playerData).then(function(response) {
            vm.success = 'Perfil atualizado com sucesso!';
            // Update the local player data
            AuthService.storePlayerData(response.data);
        }).catch(function(error) {
            console.error('Error updating profile:', error);
            vm.error = 'Erro ao atualizar perfil. Por favor, tente novamente.';
        }).finally(function() {
            vm.loading = false;
        });
    };

    // Navigate back
    vm.goBack = function() {
        $location.path('/dashboard');
    };

    // Load profile data when controller initializes
    loadProfile();
}); 