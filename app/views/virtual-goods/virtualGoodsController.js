(function() {
    'use strict';

    angular
        .module('app')
        .controller('VirtualGoodsController', VirtualGoodsController);

    VirtualGoodsController.$inject = ['$scope', '$uibModal', 'VirtualGoodsService', 'PlayerService'];

    function VirtualGoodsController($scope, $uibModal, VirtualGoodsService, PlayerService) {
        var vm = this;

        // Properties
        vm.virtualGoods = [];
        vm.purchaseHistory = [];
        vm.playerBalance = {};
        vm.loading = true;
        vm.error = null;
        vm.successMessage = null;
        vm.selectedGood = null;
        vm.processing = false;

        // Methods
        vm.purchaseGood = purchaseGood;
        vm.confirmPurchase = confirmPurchase;

        // Initialize
        activate();

        function activate() {
            loadVirtualGoods();
            loadPlayerBalance();
            loadPurchaseHistory();
        }

        function loadVirtualGoods() {
            VirtualGoodsService.getVirtualGoods()
                .then(function(response) {
                    vm.virtualGoods = response.data;
                })
                .catch(function(error) {
                    vm.error = 'Erro ao carregar itens virtuais';
                    console.error('Error loading virtual goods:', error);
                })
                .finally(function() {
                    vm.loading = false;
                });
        }

        function loadPlayerBalance() {
            PlayerService.getBalance()
                .then(function(response) {
                    vm.playerBalance = response.data;
                })
                .catch(function(error) {
                    console.error('Error loading player balance:', error);
                });
        }

        function loadPurchaseHistory() {
            VirtualGoodsService.getPurchaseHistory()
                .then(function(response) {
                    vm.purchaseHistory = response.data;
                })
                .catch(function(error) {
                    console.error('Error loading purchase history:', error);
                });
        }

        function purchaseGood(good) {
            vm.selectedGood = good;
            $('#purchaseModal').modal('show');
        }

        function confirmPurchase() {
            if (!vm.selectedGood) return;

            vm.processing = true;
            vm.error = null;
            vm.successMessage = null;

            VirtualGoodsService.purchaseVirtualGood(vm.selectedGood._id)
                .then(function(response) {
                    vm.successMessage = 'Item comprado com sucesso!';
                    // Update player balance
                    vm.playerBalance.misscoins -= vm.selectedGood.price;
                    // Add to purchase history
                    vm.purchaseHistory.unshift({
                        goodName: vm.selectedGood.name,
                        price: vm.selectedGood.price,
                        purchaseDate: new Date()
                    });
                    // Close modal
                    $('#purchaseModal').modal('hide');
                })
                .catch(function(error) {
                    vm.error = 'Erro ao realizar a compra';
                    console.error('Error purchasing virtual good:', error);
                })
                .finally(function() {
                    vm.processing = false;
                });
        }
    }
})(); 