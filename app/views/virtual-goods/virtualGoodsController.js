(function() {
    'use strict';

    angular
        .module('app')
        .controller('VirtualGoodsController', VirtualGoodsController);

    VirtualGoodsController.$inject = ['$scope', '$http', 'PlayerService', 'FUNIFIER_API_CONFIG', '$timeout', 'SuccessMessageService'];

    function VirtualGoodsController($scope, $http, PlayerService, FUNIFIER_API_CONFIG, $timeout, SuccessMessageService) {
        var vm = this;

        // Catalog and filters
        vm.catalogItems = [];
        vm.filteredItems = [];
        vm.sortType = 'value'; // 'value' or 'alpha'
        vm.sortOrder = 'asc'; // 'asc' or 'desc'
        vm.setSort = setSort;

        // Purchase history
        vm.purchaseHistory = [];

        // Player Misscoins
        vm.playerMisscoins = 0;

        // Methods
        vm.exchangeItem = exchangeItem;
        vm.goBack = function() {
            if (window.angular && angular.element(document.body).injector()) {
                var $location = angular.element(document.body).injector().get('$location');
                $location.path('/dashboard');
                if (!angular.element(document.body).scope().$$phase) {
                    angular.element(document.body).scope().$apply();
                }
            } else {
                window.location.hash = '#!/dashboard';
            }
        };

        SuccessMessageService.fetchAll();

        activate();

        function activate() {
            loadPlayerStatusAndHistory();
        }

        function loadCatalog() {
            $http({
                method: 'GET',
                url: FUNIFIER_API_CONFIG.baseUrl + '/virtualgoods/item',
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json' }
            }).then(function(response) {
                // All items from 'recompensas' catalog, but mark canExchange and canAfford
                vm.catalogItems = response.data.filter(function(item) {
                    return item.catalogId === 'recompensas';
                }).map(function(item) {
                    item.canExchange = Array.isArray(item.requires) && item.requires.length > 0 && item.requires[0].item === 'misscoins';
                    item.missingReason = !item.canExchange ? 'Este item não está disponível para troca no momento.' : '';
                    // Add canAfford flag for UI
                    var misscoins = item.requires && item.requires[0] && item.requires[0].total ? item.requires[0].total : 0;
                    item.canAfford = (typeof vm.playerMisscoins === 'number') ? (vm.playerMisscoins >= misscoins) : true;
                    return item;
                });
                if (vm.catalogItems.length) {
                    console.log('First catalog item:', vm.catalogItems[0]);
                }
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

        function loadPlayerStatusAndHistory() {
            PlayerService.getStatus().then(function(response) {
                var player = response.data;
                vm.playerStatus = player;
                // Set playerMisscoins for UI reference (fixed to use pointCategories)
                vm.playerMisscoins =
                    (player.pointCategories && player.pointCategories.misscoins) ||
                    (player.point_categories && player.point_categories.misscoins) ||
                    0;
                var playerId = player._id || player.name;
                // Fetch all catalog items for joining
                var reqCatalog = {
                    method: 'GET',
                    url: FUNIFIER_API_CONFIG.baseUrl + '/virtualgoods/item',
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json' }
                };
                // Fetch all achievements
                var reqAchievements = {
                    method: 'GET',
                    url: FUNIFIER_API_CONFIG.baseUrl + '/achievement',
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json' }
                };
                $http(reqCatalog).then(function(res) {
                    var allGoods = res.data;
                    $http(reqAchievements).then(function(achRes) {
                        var achievements = achRes.data;
                        // Filter for current player and type 2 (item exchanges)
                        var playerAchievements = achievements.filter(function(a) {
                            return (a.player === playerId) && a.type === 2;
                        });
                        // Map to history entries
                        var purchaseList = playerAchievements.map(function(a) {
                            var item = allGoods.find(function(i) { return i._id === a.item; });
                            return item ? {
                                name: item.name,
                                image: item.image && item.image.small && item.image.small.url,
                                misscoins: getMisscoins(item),
                                description: item.description,
                                date: new Date(a.time),
                                quantity: 1
                            } : null;
                        }).filter(Boolean);
                        // Sort by date desc
                        purchaseList.sort(function(a, b) {
                            if (!a.date || !b.date) return 0;
                            return b.date - a.date;
                        });
                        vm.purchaseHistory = purchaseList;
                        $timeout(function() { $scope.$applyAsync(); });
                    });
                });
                // Now that playerMisscoins is set, load the catalog
                loadCatalog();
            });
        }

        function exchangeItem(item) {
            if (!item.canExchange) {
                showResultModal('Indisponível', item.missingReason || 'Este item não está disponível para troca no momento.', false);
                return;
            }
            if (!item.canAfford) {
                showResultModal('Misscoins insuficientes', 'Você não possui misscoins suficientes para trocar por este item.', false);
                return;
            }
            // Use $uibModal if available, else fallback to custom overlay
            if (window.angular && angular.element(document.body).injector().has('$uibModal')) {
                var $uibModal = angular.element(document.body).injector().get('$uibModal');
                var modalInstance = $uibModal.open({
                    template: '<div style="padding:24px;text-align:center"><img ng-if="modal.item.image && modal.item.image.small && modal.item.image.small.url" ng-src="{{modal.item.image.small.url}}" style="width:80px;height:80px;border-radius:16px;background:#fff;margin-bottom:12px;"><div style="font-weight:bold;font-size:1.2em;margin-bottom:8px;">{{modal.item.name}}</div><div style="color:#aaa;margin-bottom:12px;">{{modal.item.description}}</div><div class="points-pill" style="margin-bottom:18px;"><i class="bi bi-coin"></i> {{modal.item.requires[0].total}}</div><div>Tem certeza que deseja trocar <b>{{modal.item.requires[0].total}}</b> misscoins por este item?</div><div style="margin-top:18px;"><button class="btn btn-primary" ng-click="ok()">Trocar</button> <button class="btn btn-default" ng-click="cancel()">Cancelar</button></div></div>',
                    controller: ['$scope', '$uibModalInstance', 'item', function($scope, $uibModalInstance, item) {
                        $scope.modal = { item: item };
                        $scope.ok = function() { $uibModalInstance.close(item); };
                        $scope.cancel = function() { $uibModalInstance.dismiss('cancel'); };
                    }],
                    resolve: { item: function() { return item; } },
                    size: 'sm'
                });
                modalInstance.result.then(function(selectedItem) {
                    confirmExchange(selectedItem, $uibModal);
                });
            } else {
                // Fallback: custom overlay or browser confirm
                if (window.confirm('Tem certeza que deseja trocar ' + (item.requires[0] && item.requires[0].total) + ' misscoins por ' + item.name + '?')) {
                    confirmExchange(item);
                }
            }
        }

        function confirmExchange(item, $uibModal) {
            var playerId = vm.playerStatus._id || (vm.playerStatus && vm.playerStatus.name);
            var payload = { player: playerId, item: item._id, total: 1 };
            $http({
                method: 'POST',
                url: FUNIFIER_API_CONFIG.baseUrl + '/virtualgoods/purchase',
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json' },
                data: payload
            }).then(function(response) {
                if (response.data.status === 'OK') {
                    showResultModal('Sucesso', SuccessMessageService.get('exchange_success'), true, $uibModal);
                    loadPlayerStatusAndHistory();
                } else if (response.data.status === 'UNAUTHORIZED') {
                    var reasons = (response.data.restrictions || []).map(translateRestriction).join('<br>');
                    showResultModal('Não autorizado', 'Não foi possível realizar a troca:<br>' + reasons, false, $uibModal);
                } else {
                    showResultModal('Erro', 'Erro desconhecido ao realizar a troca.', false, $uibModal);
                }
            }, function(err) {
                showResultModal('Erro', 'Erro ao realizar a troca.', false, $uibModal);
            });
        }

        function showResultModal(title, message, success, $uibModal) {
            if ($uibModal) {
                $uibModal.open({
                    template: '<div style="padding:24px;text-align:center"><div style="font-size:2.2em;margin-bottom:8px;">' + (success ? '✅' : '❌') + '</div><div style="font-weight:bold;font-size:1.2em;margin-bottom:8px;">' + title + '</div><div style="color:#aaa;margin-bottom:12px;">' + message + '</div><button class="btn btn-primary" ng-click="$close()">OK</button></div>',
                    size: 'sm'
                });
            } else {
                alert(title + '\n' + message.replace(/<br>/g, '\n'));
            }
        }

        function translateRestriction(code) {
            var map = {
                'insufficient_requirements': 'Requisitos insuficientes',
                'item_out_of_time': 'Item fora do período de troca',
                'limit_exceeded': 'Limite excedido',
                'principal_not_allowed': 'Usuário não autorizado'
            };
            return map[code] || code;
        }
    }
})(); 