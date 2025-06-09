(function() {
    'use strict';

    angular
        .module('app')
        .controller('DashboardController', DashboardController);

    DashboardController.$inject = ['$scope', '$location', 'AuthService', 'PlayerService', 'EventService', 'ActivityService', '$http', 'FUNIFIER_API_CONFIG', '$timeout', '$rootScope', 'SuccessMessageService', 'CashbackExpiryService', 'ThemeConfigService'];

    function DashboardController($scope, $location, AuthService, PlayerService, EventService, ActivityService, $http, FUNIFIER_API_CONFIG, $timeout, $rootScope, SuccessMessageService, CashbackExpiryService, ThemeConfigService) {
        var vm = this;

        // Properties
        vm.playerStatus = {};
        vm.activities = [];
        vm.events = [];
        vm.loading = true;
        vm.error = null;
        vm.completedChallenges = [];
        vm.purchaseHistory = [];
        vm.qrUrl = 'https://google.com';
        vm.completedChallengesDisplay = [];
        vm.purchaseHistoryDisplay = [];
        vm.qrReady = false;
        vm.qrImgUrl = '';
        vm.accordionOpen = 1;
        vm.successMessage = null;
        vm.dailyLoginMessage = '';
        vm.daysToCashbackExpiry = null;
        vm.referralCode = '';
        vm.cashbackPoints = 0;
        vm.cashbackReais = 0;
        vm.historyModalOpen = false;
        vm.historyModalData = null;
        vm.historyModalLoading = false;
        vm.showTutorialModal = !localStorage.getItem('tutorialSeen');
        vm.tutorialStep = 1;
        vm.tutorialPersonagemSrc = '/imagens/personagem1.png';
        vm.tutorialButtonLabel = 'Próximo';
        vm.currentPlayer = null;
        vm.challenges = [];
        vm.virtualGoods = [];
        vm.isLoading = true;

        // Methods
        vm.goToProfile = goToProfile;
        vm.goToRewards = goToRewards;
        vm.goToPurchases = goToPurchases;
        vm.shareOnSocial = shareOnSocial;
        vm.registerForEvent = registerForEvent;
        vm.goToChallenge = function(challenge) {
            console.log('Clicked challenge:', challenge);
            // $location.path('/challenge/' + challenge.id); // to be implemented
        };
        vm.goToPurchase = function(item) {
            console.log('Clicked purchase:', item);
            // $location.path('/virtual-good/' + item.id); // to be implemented
        };
        vm.goToStore = function() {
            $location.path('/virtual-goods');
        };
        vm.goToFidelidade = function() {
            $location.path('/fidelidade');
        };
        vm.goToQuiz = function() {
            $location.path('/quiz');
        };
        vm.logout = function() {
            AuthService.logout();
            $location.path('/login');
        };
        vm.toggleAccordion = function(idx) {
            vm.accordionOpen = (vm.accordionOpen === idx) ? -1 : idx;
        };
        vm.goToRegisterPurchase = function() {
            $location.path('/register-purchase');
        };
        vm.goToEvents = function() {
            $location.path('/events');
        };
        vm.goToCashbackCoupon = function() {
            $location.path('/cashback-coupon');
        };
        vm.openHistoryModal = function(item, type) {
            vm.historyModalOpen = true;
            vm.historyModalLoading = true;
            vm.historyModalData = null;
            var playerId = vm.playerStatus._id || (vm.playerStatus.extra && vm.playerStatus.extra._id);
            var challengeId = item.id || item._id;
            var vgId = item.id || item._id;
            // Fetch both achievements and action log
            var achievementsReq = $http.get(FUNIFIER_API_CONFIG.baseUrl + '/achievement', {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json' }
            });
            var actionLogReq = $http.get(FUNIFIER_API_CONFIG.baseUrl + '/action/log', {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json' }
            });
            Promise.all([achievementsReq, actionLogReq]).then(function(responses) {
                var achievements = responses[0].data || [];
                var actionLogs = responses[1].data || [];
                var match = null;
                var date = null;
                var value = null;
                if (type === 'challenge') {
                    match = achievements.find(function(a) {
                        return a.player === playerId && a.type === 1 && (a.item === challengeId || a.item === item.name);
                    });
                    if (match) {
                        date = match.time;
                        value = match.total;
                    }
                } else if (type === 'purchase') {
                    match = achievements.find(function(a) {
                        return a.player === playerId && a.type === 2 && (a.item === vgId || a.item === item.name);
                    });
                    if (!match) {
                        match = actionLogs.find(function(log) {
                            return log.userId === playerId && log.actionId === 'comprar' &&
                                ((log.attributes && (log.attributes.produto === item.name || log.attributes.produto === vgId)) ||
                                 log.attributes && log.attributes.product === item.name);
                        });
                        if (match) {
                            date = match.time;
                            value = match.attributes && (match.attributes.valor || match.attributes.price);
                        }
                    } else {
                        date = match.time;
                        value = match.total;
                    }
                }
                // Always show at least the item info
                vm.historyModalData = {
                    name: item.name,
                    image: item.image,
                    badge: item.badge,
                    description: item.description,
                    date: date,
                    value: value,
                    extra: match || null
                };
            }).finally(function() {
                vm.historyModalLoading = false;
                $scope.$applyAsync && $scope.$applyAsync();
            });
        };
        vm.closeHistoryModal = function() {
            vm.historyModalOpen = false;
            vm.historyModalData = null;
        };
        vm.goToSocial = goToSocial;
        vm.goToHistory = goToHistory;
        vm.loadData = loadData;

        // Initialize
        activate();

        function activate() {
            vm.currentPlayer = AuthService.getCurrentPlayer();
            if (!vm.currentPlayer) {
                $location.path('/login');
                return;
            }
            loadData();
        }

        function loadData() {
            vm.isLoading = true;
            vm.error = null;

            // Load player status and other data
            PlayerService.getPlayerStatus()
                .then(function(playerStatus) {
                    vm.playerStatus = playerStatus;
                    return loadChallenges();
                })
                .then(function() {
                    return loadVirtualGoods();
                })
                .then(function() {
                    vm.isLoading = false;
                })
                .catch(function(error) {
                    vm.isLoading = false;
                    vm.error = 'Erro ao carregar dados do dashboard';
                });
        }

        function loadChallenges() {
            return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/challenges')
                .then(function(response) {
                    var allChallenges = response.data || [];
                    vm.challenges = allChallenges;
                    
                    // Process completed challenges
                    if (vm.playerStatus && vm.playerStatus.challenges) {
                        vm.completedChallengesDisplay = vm.playerStatus.challenges
                            .map(function(playerChallenge) {
                                var challengeId = playerChallenge.challengeId || playerChallenge._id;
                                var matchingChallenge = allChallenges.find(function(c) {
                                    return c._id === challengeId;
                                });
                                
                                if (matchingChallenge) {
                                    return {
                                        name: matchingChallenge.name,
                                        image: matchingChallenge.image,
                                        completedCount: playerChallenge.completedCount || 1,
                                        completedAt: playerChallenge.completedAt
                                    };
                                }
                                return null;
                            })
                            .filter(function(item) {
                                return item !== null;
                            });
                    }
                })
                .catch(function(error) {
                    vm.error = 'Erro ao carregar desafios';
                });
        }

        function loadVirtualGoods() {
            return $http.get(FUNIFIER_API_CONFIG.baseUrl + '/virtual-goods')
                .then(function(response) {
                    var allVirtualGoods = response.data || [];
                    
                    // Process virtual goods from player status
                    if (vm.playerStatus && vm.playerStatus.catalog_items) {
                        vm.virtualGoods = vm.playerStatus.catalog_items
                            .map(function(catalogItem) {
                                var itemId = catalogItem.itemId || catalogItem._id;
                                var matchingGood = allVirtualGoods.find(function(i) {
                                    return i._id === itemId;
                                });
                                
                                if (matchingGood) {
                                    return {
                                        name: matchingGood.name,
                                        image: matchingGood.image,
                                        quantity: catalogItem.quantity || 1,
                                        obtainedAt: catalogItem.obtainedAt
                                    };
                                }
                                return null;
                            })
                            .filter(function(item) {
                                return item !== null;
                            });
                    }
                })
                .catch(function(error) {
                    vm.error = 'Erro ao carregar itens virtuais';
                });
        }

        function goToProfile() {
            $location.path('/profile');
        }

        function goToRewards() {
            $location.path('/rewards');
        }

        function goToPurchases() {
            $location.path('/purchases');
        }

        function shareOnSocial() {
            // Implement social sharing functionality
            const shareData = {
                title: 'Jogue comigo!',
                text: 'Venha jogar comigo e ganhe pontos!',
                url: window.location.origin
            };

            if (navigator.share) {
                navigator.share(shareData)
                    .catch(function(error) {
                        console.error('Error sharing:', error);
                    });
            } else {
                // Fallback for browsers that don't support Web Share API
                const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`;
                window.open(shareUrl, '_blank');
            }
        }

        function registerForEvent(eventId) {
            EventService.register(eventId)
                .then(function(response) {
                    // Update the event in the list
                    const eventIndex = vm.events.findIndex(e => e._id === eventId);
                    if (eventIndex !== -1) {
                        vm.events[eventIndex].registered = true;
                    }
                })
                .catch(function(error) {
                    vm.error = 'Erro ao se inscrever no evento';
                    console.error('Error registering for event:', error);
                });
        }

        $scope.status = $scope.status || { open1: true, open2: false, open3: false };

        // Listen for profile update events to refresh player status
        $scope.$on('profile-updated', function() {
            activate();
        });

        // Log 'logar' action if not already logged today
        function checkAndLogLoginAction() {
            var todayStr = (new Date()).toISOString().slice(0, 10); // YYYY-MM-DD
            var lastLoginDay = localStorage.getItem('lastDailyLoginDay');
            if (lastLoginDay === todayStr) {
                // Already logged in today, do not trigger again
                return;
            }
            ActivityService.getByType('logar').then(function(response) {
                var player = PlayerService.getCurrentPlayer();
                var userId = player && (player._id || player.name);
                var logs = (response.data || []).filter(function(log) {
                    return log.actionId === 'logar' && log.userId === userId;
                });
                var today = new Date();
                var found = logs.some(function(log) {
                    var logDate = new Date(log.createdAt || log.date || log.timestamp || log.time);
                    return logDate.getFullYear() === today.getFullYear() &&
                        logDate.getMonth() === today.getMonth() &&
                        logDate.getDate() === today.getDate();
                });
                if (!found) {
                    ActivityService.logAction('logar').then(function() {
                        localStorage.setItem('lastDailyLoginDay', todayStr);
                        SuccessMessageService.fetchAll().then(function() {
                            vm.dailyLoginMessage = SuccessMessageService.get('login_success') || 'Login diário concluído!';
                            $scope.dailyLoginPopup = true;
                            $timeout(function() { $scope.dailyLoginPopup = false; }, 3500);
                            $scope.$applyAsync();
                        });
                    });
                } else {
                    // Even if found in backend, set localStorage to prevent re-trigger
                    localStorage.setItem('lastDailyLoginDay', todayStr);
                }
            });
        }

        // --- Dashboard Buttons (Funifier sync) ---
        var FUNIFIER_API = 'https://service2.funifier.com/v3/database/dashboard_buttons__c';
        var CONFIG_ID = 'dashboard_buttons';
        var basicAuth = 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==';
        var defaultDashboardButtons = [
            { id: 'default-events', label: 'Próximos eventos', icon: 'bi-calendar-event', route: '/events', visible: true, isDefault: true, click: vm.goToEvents },
            { id: 'default-fidelidade', label: 'Fidelidade', icon: 'bi-puzzle', route: '/fidelidade', visible: true, isDefault: true, click: vm.goToFidelidade },
            { id: 'default-register', label: 'Registrar compra', icon: 'bi-receipt', route: '/register-purchase', visible: true, isDefault: true, click: vm.goToRegisterPurchase },
            { id: 'default-store', label: 'Loja', icon: 'bi-shop', route: '/virtual-goods', visible: true, isDefault: true, click: vm.goToStore },
            { id: 'default-social', label: 'Rede Social', icon: 'bi-hash', route: '/social', visible: true, isDefault: true, click: vm.goToSocial },
            { id: 'default-quiz', label: 'Quiz - Teste seu conhecimento!', icon: 'bi-chat-dots', route: '/quiz', visible: true, isDefault: true, click: vm.goToQuiz }
        ];
        function loadDashboardButtons() {
            $http.get(FUNIFIER_API + "?strict=true&q=_id:'" + CONFIG_ID + "'", { headers: { Authorization: basicAuth } })
                .then(function(resp) {
                    var data = (resp.data && resp.data[0] && resp.data[0].value) ? resp.data[0].value : [];
                    // Merge defaults: use override if present, else visible: true
                    var all = defaultDashboardButtons.map(function(def) {
                        var found = data.find(function(btn) { return btn.id === def.id; });
                        if (found && typeof found.visible !== 'undefined') {
                            return Object.assign({}, def, { visible: found.visible });
                        }
                        return def;
                    });
                    // Add all custom buttons (not default)
                    data.forEach(function(btn) {
                        if (!btn.isDefault) all.push(btn);
                    });
                    vm.dashboardButtons = all.filter(function(btn) { return btn.visible !== false; });
                })
                .catch(function() {
                    // Fallback to defaults
                    vm.dashboardButtons = defaultDashboardButtons.filter(function(btn) { return btn.visible !== false; });
                });
        }
        loadDashboardButtons();
        vm.handleDashboardButton = function(btn) {
            if (btn.isDefault && typeof btn.click === 'function') {
                btn.click();
            } else if (btn.route) {
                // External link if not internal route
                if (/^(https?:)?\/\//.test(btn.route) || btn.route.indexOf('/') !== 0) {
                    var url = btn.route;
                    if (!/^https?:\/\//.test(url)) url = 'https://' + url;
                    window.open(url, '_blank');
                } else {
                    $location.path(btn.route);
                }
            }
        };

        function goToSocial() {
            $location.path('/social');
        }

        function goToHistory() {
            $location.path('/history');
        }
    }
})(); 