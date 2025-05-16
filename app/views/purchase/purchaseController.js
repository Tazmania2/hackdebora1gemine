angular.module('funifierApp').controller('PurchaseController', function($scope, $location, PlayerService) {
    var vm = this;

    vm.purchase = {
        amount: 0,
        description: '',
        date: new Date()
    };
    vm.isLoading = false;
    vm.errorMessage = '';
    vm.successMessage = '';

    vm.registerPurchase = function() {
        vm.isLoading = true;
        vm.errorMessage = '';
        vm.successMessage = '';

        PlayerService.registerPurchase(vm.purchase)
            .then(function(response) {
                vm.successMessage = 'Compra registrada com sucesso!';
                vm.purchase = {
                    amount: 0,
                    description: '',
                    date: new Date()
                };
            })
            .catch(function(error) {
                vm.errorMessage = 'Erro ao registrar compra.';
                console.error('Error registering purchase:', error);
            })
            .finally(function() {
                vm.isLoading = false;
            });
    };
}); 