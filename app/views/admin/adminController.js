angular.module('funifierApp').controller('AdminController', function($scope, AdminService) {
    var vm = this;

    vm.programRules = {};
    vm.rewards = [];
    vm.stats = {};
    vm.activePlayers = [];
    vm.isLoading = false;
    vm.errorMessage = '';

    function loadProgramRules() {
        AdminService.getProgramRules()
            .then(function(response) {
                vm.programRules = response.data;
            })
            .catch(function(error) {
                console.error('Error loading program rules:', error);
            });
    }

    function loadRewards() {
        AdminService.getRewardsCatalog()
            .then(function(response) {
                vm.rewards = response.data;
            })
            .catch(function(error) {
                console.error('Error loading rewards:', error);
            });
    }

    function loadStats() {
        AdminService.getProgramStats()
            .then(function(response) {
                vm.stats = response.data;
            })
            .catch(function(error) {
                console.error('Error loading stats:', error);
            });
    }

    function loadActivePlayers() {
        AdminService.getActivePlayers()
            .then(function(response) {
                vm.activePlayers = response.data;
            })
            .catch(function(error) {
                console.error('Error loading active players:', error);
            });
    }

    vm.updateProgramRules = function() {
        vm.isLoading = true;
        AdminService.updateProgramRules(vm.programRules)
            .then(function(response) {
                vm.successMessage = 'Regras atualizadas com sucesso!';
            })
            .catch(function(error) {
                vm.errorMessage = 'Erro ao atualizar regras.';
                console.error('Error updating rules:', error);
            })
            .finally(function() {
                vm.isLoading = false;
            });
    };

    // Load data when controller initializes
    loadProgramRules();
    loadRewards();
    loadStats();
    loadActivePlayers();
}); 