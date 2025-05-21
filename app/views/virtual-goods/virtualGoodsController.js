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
        vm.goBack = function() {
            window.location.hash = '#!/dashboard';
        };

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
            // Use $uibModal if available, else fallback to confirm
            if (window.angular && angular.element(document.body).injector().has('$uibModal')) {
                var $uibModal = angular.element(document.body).injector().get('$uibModal');
                var modalInstance = $uibModal.open({
                    template: '<div style="padding:24px;text-align:center"><img ng-if="item.image && item.image.small && item.image.small.url" ng-src="{{item.image.small.url}}" style="width:80px;height:80px;border-radius:16px;background:#fff;margin-bottom:12px;"><div style="font-weight:bold;font-size:1.2em;margin-bottom:8px;">{{item.name}}</div><div style="color:#aaa;margin-bottom:12px;">{{item.description}}</div><div class="points-pill" style="margin-bottom:18px;"><i class="bi bi-coin"></i> {{item.requires[0].total}}</div><div>Tem certeza que deseja trocar <b>{{item.requires[0].total}}</b> misscoins por este item?</div><div style="margin-top:18px;"><button class="btn btn-primary" ng-click="ok()">Trocar</button> <button class="btn btn-default" ng-click="cancel()">Cancelar</button></div></div>',
                    controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
                        $scope.item = item;
                        $scope.ok = function() { $uibModalInstance.close(true); };
                        $scope.cancel = function() { $uibModalInstance.dismiss('cancel'); };
                    }],
                    size: 'sm'
                });
                modalInstance.result.then(function() {
                    doExchange(item);
                });
            } else {
                if (window.confirm('Tem certeza que deseja trocar ' + item.requires[0].total + ' misscoins por ' + item.name + '?')) {
                    doExchange(item);
                }
            }
        }

        function doExchange(item) {
            var playerId = vm.playerStatus._id || (vm.playerStatus && vm.playerStatus.name);
            var req = {
                method: 'POST',
                url: FUNIFIER_API_CONFIG.baseUrl + '/virtualgoods/purchase',
                headers: { 'Authorization': localStorage.getItem('token'), 'Content-Type': 'application/json' },
                data: {
                    player: playerId,
                    item: item._id,
                    total: 1
                }
            };
            $http(req).then(function(response) {
                if (response.data.status === 'OK') {
                    alert('Troca realizada com sucesso!');
                    loadCatalog();
                    loadPurchaseHistory();
                    PlayerService.getStatus().then(function(res) { vm.playerStatus = res.data; });
                } else {
                    alert('Não foi possível realizar a troca: ' + (response.data.restrictions && response.data.restrictions.join(', ')));
                }
            }, function(err) {
                alert('Erro ao realizar a troca.');
            });
        }
    }
})(); 