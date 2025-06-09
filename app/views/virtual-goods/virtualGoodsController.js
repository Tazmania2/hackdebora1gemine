(function() {
    'use strict';

    angular
        .module('app')
        .controller('VirtualGoodsController', VirtualGoodsController);

    VirtualGoodsController.$inject = ['$scope', '$http', '$location', '$uibModal', 'PlayerService', 'FUNIFIER_API_CONFIG', 'ActivityService', '$timeout', 'SuccessMessageService'];

    function VirtualGoodsController($scope, $http, $location, $uibModal, PlayerService, FUNIFIER_API_CONFIG, ActivityService, $timeout, SuccessMessageService) {
        var vm = this;

        // Catalog and filters
        vm.catalogItems = [];
        vm.filteredItems = [];
        vm.selectedCategory = 'Todos';
        vm.categories = ['Todos'];

        // Purchase history
        vm.purchaseHistory = [];

        // Player Misscoins
        vm.playerMisscoins = 0;

        // Methods
        vm.filterByCategory = filterByCategory;
        vm.exchangeItem = exchangeItem;
        vm.goToDashboard = goToDashboard;
        vm.loadCatalogItems = loadCatalogItems;

        // Properties
        vm.loading = true;
        vm.error = null;

        // Initialize
        activate();

        function activate() {
            loadPlayerMisscoins().then(function() {
                loadCatalogItems();
                loadPurchaseHistory();
            });
        }

        function loadPlayerMisscoins() {
            return PlayerService.getPlayerStatus()
                .then(function(response) {
                    var pointCategories = response.pointCategories || response.point_categories || {};
                    vm.playerMisscoins = pointCategories.misscoins || 0;
                })
                .catch(function(error) {
                    vm.error = 'Erro ao carregar moedas do jogador';
                });
        }

        function loadCatalogItems() {
            vm.loading = true;
            
            // All items from 'recompensas' catalog, but mark canExchange and canAfford
            var req = {
                method: 'GET',
                url: FUNIFIER_API_CONFIG.baseUrl + '/virtualgoods/item?catalog=recompensas',
                headers: {
                    'Authorization': localStorage.getItem('token'),
                    'Content-Type': 'application/json'
                }
            };

            $http(req).then(function(response) {
                vm.catalogItems = (response.data || []).map(function(item) {
                    // Use 'misscoins' for backend logic
                    var misscoinsCost = (item.requires && Array.isArray(item.requires) && item.requires.find(function(r) { return r.item === 'misscoins'; })) 
                        ? item.requires.find(function(r) { return r.item === 'misscoins'; }).total 
                        : 0;
                    
                    // Add canAfford flag for UI
                    item.canAfford = vm.playerMisscoins >= misscoinsCost;
                    item.misscoinsCost = misscoinsCost;
                    
                    return item;
                });

                // Extract unique categories
                var categorySet = new Set(['Todos']);
                vm.catalogItems.forEach(function(item) {
                    if (item.category) {
                        categorySet.add(item.category);
                    }
                });
                vm.categories = Array.from(categorySet);

                // Apply initial filter
                filterByCategory(vm.selectedCategory);
                vm.loading = false;
            }).catch(function(error) {
                vm.error = 'Erro ao carregar catálogo';
                vm.loading = false;
            });
        }

        function loadPurchaseHistory() {
            // Set playerMisscoins for UI reference (fixed to use pointCategories)
            PlayerService.getPlayerStatus().then(function(response) {
                var pointCategories = response.pointCategories || response.point_categories || {};
                vm.playerMisscoins = pointCategories.misscoins || 0;
            });

            // Fetch all catalog items for joining
            var allCatalogItemsPromise = $http.get(FUNIFIER_API_CONFIG.baseUrl + '/virtualgoods/item', {
                headers: { 'Authorization': localStorage.getItem('token') }
            });

            // Fetch all achievements
            var allAchievementsPromise = $http.get(FUNIFIER_API_CONFIG.baseUrl + '/achievement', {
                headers: { 'Authorization': localStorage.getItem('token') }
            });

            Promise.all([allCatalogItemsPromise, allAchievementsPromise]).then(function(responses) {
                var allCatalogItems = responses[0].data || [];
                var allAchievements = responses[1].data || [];

                // Filter for current player and type 2 (item exchanges)
                var currentPlayer = PlayerService.getCurrentPlayer();
                var playerId = currentPlayer ? currentPlayer._id : null;

                // Map to history entries
                var historyEntries = allAchievements
                    .filter(function(ach) {
                        return ach.player === playerId && ach.type === 2;
                    })
                    .map(function(ach) {
                        var catalogItem = allCatalogItems.find(function(item) {
                            return item._id === ach.target;
                        });
                        
                        return {
                            id: ach._id,
                            itemName: catalogItem ? catalogItem.name : 'Item não encontrado',
                            itemImage: catalogItem && catalogItem.image ? catalogItem.image.small.url : null,
                            date: new Date(ach.date),
                            points: ach.points || 0
                        };
                    });

                // Sort by date desc
                vm.purchaseHistory = historyEntries.sort(function(a, b) {
                    return b.date - a.date;
                });
            }).catch(function(error) {
                vm.error = 'Erro ao carregar histórico de compras';
            });
        }

        function filterByCategory(category) {
            vm.selectedCategory = category;
            if (category === 'Todos') {
                vm.filteredItems = vm.catalogItems;
            } else {
                vm.filteredItems = vm.catalogItems.filter(function(item) {
                    return item.category === category;
                });
            }
        }

        function exchangeItem(item) {
            if (!item.canAfford) {
                vm.error = 'Misscoins insuficientes para esta troca';
                return;
            }

            // TEMP: Always use fallback confirm dialog for now
            var confirmed = confirm('Deseja trocar ' + item.misscoinsCost + ' misscoins por ' + item.name + '?');
            
            if (confirmed) {
                performExchange(item);
            }
        }

        function performExchange(item) {
            vm.loading = true;
            
            var req = {
                method: 'POST',
                url: FUNIFIER_API_CONFIG.baseUrl + '/virtualgoods/purchase',
                headers: {
                    'Authorization': localStorage.getItem('token'),
                    'Content-Type': 'application/json'
                },
                data: {
                    item: item._id
                }
            };

            $http(req).then(function(response) {
                // Reload player misscoins and purchase history
                return loadPlayerMisscoins();
            }).then(function() {
                loadPurchaseHistory();
                loadCatalogItems(); // Refresh to update canAfford flags
                
                // Send SMS notification after exchange
                var currentPlayer = PlayerService.getCurrentPlayer();
                if (currentPlayer && currentPlayer.phone) {
                    var message = 'Parabéns! Você trocou ' + item.misscoinsCost + ' misscoins por ' + item.name + ' na Débora Charcuteria!';
                    ActivityService.sendSMS(currentPlayer.phone, message);
                }
                
                vm.loading = false;
                vm.error = null;
                SuccessMessageService.show('Troca realizada com sucesso!');
            }).catch(function(error) {
                vm.loading = false;
                vm.error = 'Erro ao realizar troca';
            });
        }

        function goToDashboard() {
            $location.path('/dashboard');
        }
    }
})(); 