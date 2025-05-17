angular.module('funifierApp').controller('ProfileController', function($scope, $http, $location, AuthService, FUNIFIER_API_CONFIG, PlayerService, $httpParamSerializer) {
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

    // Upload and update profile image
    vm.uploadProfileImage = function() {
        if (!vm.newImageFile) {
            vm.error = 'Por favor, selecione uma imagem.';
            return;
        }
        vm.loading = true;
        vm.error = null;
        vm.success = null;
        // Prepare form data
        var formData = new FormData();
        formData.append('file', vm.newImageFile);
        formData.append('extra', JSON.stringify({
            session: 'images',
            transform: [{ stage: 'size', width: 350, height: 350 }]
        }));
        $http({
            method: 'POST',
            url: FUNIFIER_API_CONFIG.baseUrl + '/upload/image',
            headers: {
                'Authorization': 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==',
                'Content-Type': undefined // Let browser set multipart/form-data
            },
            data: formData,
            transformRequest: angular.identity
        }).then(function(response) {
            if (response.data && response.data.uploads && response.data.uploads[0] && response.data.uploads[0].url) {
                var imageUrl = response.data.uploads[0].url;
                // Update the profile with the new image URL using recreatePlayer
                var playerData = angular.copy(vm.editedProfile);
                
                // Ensure required fields exist
                playerData.teams = playerData.teams || [];
                playerData.friends = playerData.friends || [];
                playerData.business = playerData.business || false;
                playerData.developer = playerData.developer || false;
                if (!playerData.created) {
                    playerData.created = Date.now();
                }
                
                // Set image at root level with all required sizes
                playerData.image = {
                    small: {
                        url: imageUrl,
                        size: 0,
                        width: 0,
                        height: 0,
                        depth: 0
                    },
                    medium: {
                        url: imageUrl,
                        size: 0,
                        width: 0,
                        height: 0,
                        depth: 0
                    },
                    original: {
                        url: imageUrl,
                        size: 0,
                        width: 0,
                        height: 0,
                        depth: 0
                    }
                };
                
                // Remove the image from extra if it exists
                if (playerData.extra && playerData.extra.image) {
                    delete playerData.extra.image;
                }
                
                return PlayerService.recreatePlayer(playerData);
            } else {
                throw new Error('Erro ao obter URL da imagem enviada.');
            }
        }).then(function(response) {
            vm.success = 'Imagem de perfil atualizada com sucesso!';
            // Update the local player data
            AuthService.storePlayerData(response.data);
            loadProfile();
            vm.newImageFile = null;
        }).catch(function(error) {
            console.error('Erro ao atualizar imagem de perfil:', error);
            vm.error = 'Erro ao atualizar imagem de perfil. Por favor, tente novamente.';
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

// fileModel directive for file input binding
angular.module('funifierApp').directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]); 