(function() {
    'use strict';

    angular
        .module('app')
        .controller('VirtualGoodsController', VirtualGoodsController);

    VirtualGoodsController.$inject = ['$scope', '$uibModal', 'VirtualGoodsService', 'PlayerService', '$timeout'];

    function VirtualGoodsController($scope, $uibModal, VirtualGoodsService, PlayerService, $timeout) {
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
        vm.refreshData = refreshData;
        vm.clearMessages = clearMessages;

        // Initialize
        activate();

        function activate() {
            refreshData();
            // Clear messages after 5 seconds
            $scope.$watch('vm.successMessage', function(newVal) {
                if (newVal) {
                    $timeout(clearMessages, 5000);
                }
            });
        }

        function clearMessages() {
            vm.error = null;
            vm.successMessage = null;
        }

        function refreshData() {
            vm.loading = true;
            vm.error = null;
            
            // Load all data in parallel
            Promise.all([
                loadVirtualGoods(),
                loadPlayerBalance(),
                loadPurchaseHistory()
            ]).catch(function(error) {
                vm.error = 'Erro ao carregar dados';
                console.error('Error refreshing data:', error);
            }).finally(function() {
                vm.loading = false;
            });
        }

        function loadVirtualGoods() {
            return VirtualGoodsService.getVirtualGoods()
                .then(function(response) {
                    vm.virtualGoods = response.data;
                })
                .catch(function(error) {
                    vm.error = 'Erro ao carregar itens virtuais';
                    console.error('Error loading virtual goods:', error);
                    return Promise.reject(error);
                });
        }

        function loadPlayerBalance() {
            return PlayerService.getBalance()
                .then(function(response) {
                    vm.playerBalance = response.data;
                })
                .catch(function(error) {
                    console.error('Error loading player balance:', error);
                    return Promise.reject(error);
                });
        }

        function loadPurchaseHistory() {
            return VirtualGoodsService.getPurchaseHistory()
                .then(function(response) {
                    vm.purchaseHistory = response.data;
                })
                .catch(function(error) {
                    console.error('Error loading purchase history:', error);
                    return Promise.reject(error);
                });
        }

        function purchaseGood(good) {
            if (!good || !good._id) {
                vm.error = 'Item inválido';
                return;
            }

            vm.selectedGood = good;
            $('#purchaseModal').modal('show');
        }

        function confirmPurchase() {
            if (!vm.selectedGood || !vm.selectedGood._id) {
                vm.error = 'Item inválido';
                return;
            }

            if (vm.playerBalance.misscoins < vm.selectedGood.price) {
                vm.error = 'Saldo insuficiente';
                return;
            }

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
                    // Refresh data to ensure consistency
                    refreshData();
                })
                .catch(function(error) {
                    vm.error = error.data && error.data.message ? error.data.message : 'Erro ao realizar a compra';
                    console.error('Error purchasing virtual good:', error);
                })
                .finally(function() {
                    vm.processing = false;
                });
        }
    }
})(); 