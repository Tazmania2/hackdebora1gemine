(function() {
    'use strict';

    angular
        .module('app')
        .controller('VirtualGoodsController', VirtualGoodsController);

    VirtualGoodsController.$inject = ['$scope', '$http', 'PlayerService', 'FUNIFIER_API_CONFIG', '$timeout'];

    function VirtualGoodsController($scope, $http, PlayerService, FUNIFIER_API_CONFIG, $timeout) {
        var vm = this;

        // Catalog and filters
        vm.catalogItems = [];
        vm.filteredItems = [];
        vm.sortType = 'value'; // 'value' or 'alpha'
        vm.sortOrder = 'asc'; // 'asc' or 'desc'
        vm.setSort = setSort;

        // Purchase history
        vm.purchaseHistory = [];

        // Methods
        vm.exchangeItem = exchangeItem;

        activate();

        function activate() {
            loadCatalog();
            loadPurchaseHistory();
        }

        function loadCatalog() {
            var req = {
                method: 'GET',
                url: FUNIFIER_API_CONFIG.baseUrl + '/virtualgoods/item',
                headers: { 'Authorization': localStorage.getItem('token'), 'Content-Type': 'application/json' }
            };
            $http(req).then(function(response) {
                // Only items from 'recompensas' catalog
                vm.catalogItems = response.data.filter(function(item) {
                    return item.catalogId === 'recompensas';
                });
                applyFilters();
            });
        }

        function setSort(type) {
            if (vm.sortType === type) {
                vm.sortOrder = (vm.sortOrder === 'asc') ? 'desc' : 'asc';
            } else {
                vm.sortType = type;
                vm.sortOrder = 'asc';
            }
            applyFilters();
        }

        function applyFilters() {
            var items = vm.catalogItems.slice();
            if (vm.sortType === 'value') {
                items.sort(function(a, b) {
                    var va = getMisscoins(a), vb = getMisscoins(b);
                    return vm.sortOrder === 'asc' ? va - vb : vb - va;
                });
            } else if (vm.sortType === 'alpha') {
                items.sort(function(a, b) {
                    var na = a.name.toLowerCase(), nb = b.name.toLowerCase();
                    if (na < nb) return vm.sortOrder === 'asc' ? -1 : 1;
                    if (na > nb) return vm.sortOrder === 'asc' ? 1 : -1;
                    return 0;
                });
            }
            vm.filteredItems = items;
            $timeout(function() { $scope.$applyAsync(); });
        }

        function getMisscoins(item) {
            if (item.requires && Array.isArray(item.requires)) {
                var req = item.requires.find(function(r) { return r.item === 'misscoins'; });
                return req ? req.total : 0;
            }
            return 0;
        }

        function loadPurchaseHistory() {
            PlayerService.getStatus().then(function(response) {
                var player = response.data;
                var catalogItems = player.catalog_items || {};
                var purchaseList = [];
                // We'll need the full catalog for details
                var req = {
                    method: 'GET',
                    url: FUNIFIER_API_CONFIG.baseUrl + '/virtualgoods/item',
                    headers: { 'Authorization': localStorage.getItem('token'), 'Content-Type': 'application/json' }
                };
                $http(req).then(function(res) {
                    var allGoods = res.data;
                    Object.keys(catalogItems).forEach(function(itemId) {
                        var item = allGoods.find(function(i) { return i._id === itemId; });
                        if (item) {
                            purchaseList.push({
                                name: item.name,
                                image: item.image && item.image.small && item.image.small.url,
                                misscoins: getMisscoins(item),
                                description: item.description,
                                date: catalogItems[itemId].date || null // If date is available
                            });
                        }
                    });
                    // Sort by date desc if available
                    purchaseList.sort(function(a, b) {
                        if (!a.date || !b.date) return 0;
                        return new Date(b.date) - new Date(a.date);
                    });
                    vm.purchaseHistory = purchaseList;
                    $timeout(function() { $scope.$applyAsync(); });
                });
            });
        }

        function exchangeItem(item) {
            // Placeholder for exchange logic
            alert('Trocar por: ' + item.name);
        }
    }
})(); 