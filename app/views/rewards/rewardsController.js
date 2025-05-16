angular.module('funifierApp').controller('RewardsController', function($scope, RewardsService) {
    var vm = this;

    vm.rewards = [];
    vm.redeemedRewards = [];
    vm.isLoading = false;
    vm.errorMessage = '';

    function loadRewards() {
        vm.isLoading = true;
        RewardsService.getRewardsCatalog()
            .then(function(response) {
                vm.rewards = response.data;
            })
            .catch(function(error) {
                vm.errorMessage = 'Erro ao carregar recompensas.';
                console.error('Error loading rewards:', error);
            })
            .finally(function() {
                vm.isLoading = false;
            });
    }

    function loadRedeemedRewards() {
        RewardsService.getRedeemedRewards()
            .then(function(response) {
                vm.redeemedRewards = response.data;
            })
            .catch(function(error) {
                console.error('Error loading redeemed rewards:', error);
            });
    }

    vm.redeemReward = function(rewardId) {
        vm.isLoading = true;
        RewardsService.redeemReward(rewardId)
            .then(function(response) {
                // Refresh rewards after successful redemption
                loadRewards();
                loadRedeemedRewards();
            })
            .catch(function(error) {
                vm.errorMessage = 'Erro ao resgatar recompensa.';
                console.error('Error redeeming reward:', error);
            })
            .finally(function() {
                vm.isLoading = false;
            });
    };

    // Load data when controller initializes
    loadRewards();
    loadRedeemedRewards();
}); 