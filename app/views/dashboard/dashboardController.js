(function() {
    'use strict';

    angular
        .module('app')
        .controller('DashboardController', DashboardController);

    DashboardController.$inject = ['$scope', '$location', 'AuthService', 'PlayerService', 'EventService', 'ActivityService', '$http', 'FUNIFIER_API_CONFIG', '$timeout', '$rootScope', 'SuccessMessageService', 'CashbackExpiryService'];

    function DashboardController($scope, $location, AuthService, PlayerService, EventService, ActivityService, $http, FUNIFIER_API_CONFIG, $timeout, $rootScope, SuccessMessageService, CashbackExpiryService) {
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
                if (type === 'challenge') {
                    // Match by challenge ID in achievements
                    match = achievements.find(function(a) {
                        return a.player === playerId && a.type === 1 && (a.item === challengeId || a.item === item.name);
                    });
                } else if (type === 'purchase') {
                    // Match by virtual good ID in achievements
                    match = achievements.find(function(a) {
                        return a.player === playerId && a.type === 2 && (a.item === vgId || a.item === item.name);
                    });
                    if (!match) {
                        // Fallback: match in action log
                        match = actionLogs.find(function(log) {
                            return log.userId === playerId && log.actionId === 'comprar' &&
                                ((log.attributes && (log.attributes.produto === item.name || log.attributes.produto === vgId)) ||
                                 log.attributes && log.attributes.product === item.name);
                        });
                    }
                }
                vm.historyModalData = match || null;
            }).finally(function() {
                vm.historyModalLoading = false;
                $scope.$applyAsync && $scope.$applyAsync();
            });
        };
        vm.closeHistoryModal = function() {
            vm.historyModalOpen = false;
            vm.historyModalData = null;
        };

        // Initialize
        activate();

        function activate() {
            Promise.all([
                loadPlayerStatus(),
                loadChallenges(),
                loadVirtualGoods()
            ]).then(function() {
                buildCompletedChallengesDisplay();
                buildPurchaseHistoryDisplay();
                // Run cashback expiry routine after player status is loaded
                var player = PlayerService.getCurrentPlayer();
                var playerId = player && (player._id || player.name || player.email);
                if (playerId) {
                    CashbackExpiryService.expireOldCashback(playerId)
                      .then(function() {
                        // Reload player status after expiry routine
                        return loadPlayerStatus();
                      })
                      .catch(function(err) {
                        console.error('Erro ao expirar cashback:', err);
                      });
                } else {
                    console.warn('Cashback expiry skipped: Player ID not found in status');
                }
                // Fetch days to cashback expiry for dashboard message
                CashbackExpiryService.getDaysToCashbackExpiry().then(function(days) {
                    vm.daysToCashbackExpiry = days;
                    $scope.$applyAsync && $scope.$applyAsync();
                });
                checkAndLogLoginAction();
            });
            loadActivities();
            loadEvents();

            // Show global success message if present
            if ($rootScope.successMessage) {
                vm.successMessage = $rootScope.successMessage;
                $rootScope.successMessage = null;
                $timeout(function() { vm.successMessage = null; $scope.$applyAsync && $scope.$applyAsync(); }, 3500);
            }
        }

        // --- Data holders for mapping ---
        var allChallenges = [];
        var allVirtualGoods = [];
        var playerStatus = {};

        function loadPlayerStatus() {
            vm.loading = true;
            return PlayerService.getStatus()
                .then(function(response) {
                    var data = response.data;
                    data.point_categories = data.point_categories || data.pointCategories || {};
                    vm.playerStatus = data;
                    playerStatus = data;
                    // Cashback points logic
                    var points = (data.point_categories.cashback || data.pointCategories.cashback || 0);
                    vm.cashbackPoints = points;
                    vm.cashbackReais = (points * 0.05).toFixed(2);
                    setReferralQrUrl();
                    // Merge image from /player/me and assign a new object
                    return PlayerService.getPlayerProfile().then(function(resp) {
                        if (resp.data && resp.data.image) {
                            vm.playerStatus = Object.assign({}, vm.playerStatus, { image: resp.data.image });
                        }
                        vm.loading = false;
                        $scope.$applyAsync();
                    });
                })
                .catch(function(error) {
                    vm.error = 'Erro ao carregar status do jogador';
                    vm.loading = false;
                    $scope.$applyAsync();
                    console.error('Error loading player status:', error);
                });
        }

        function setReferralQrUrl() {
            var code = (playerStatus.extra && playerStatus.extra.mycode) ? playerStatus.extra.mycode : 'N0c()63';
            vm.referralCode = code;
            // Always use the production domain for the QR code
            var url = 'https://hackdebora1gemine.vercel.app/register?referral=' + encodeURIComponent(code);
            vm.qrUrl = url;
            // Generate QR code as data URL
            var qr = window.qrcode(4, 'L');
            qr.addData(url);
            qr.make();
            // Get the data URL from the generated QR code
            var qrImg = qr.createImgTag(8); // 8 = pixel size
            // Extract src from <img src=...>
            var match = qrImg.match(/src=['\"]([^'\"]+)['\"]/);
            vm.qrImgUrl = match ? match[1] : '';
            vm.qrReady = true;
        }

        function loadChallenges() {
            var req = {
                method: 'GET',
                url: FUNIFIER_API_CONFIG.baseUrl + '/challenge',
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json' }
            };
            return $http(req).then(function(response) {
                allChallenges = response.data;
            });
        }

        function loadVirtualGoods() {
            var req = {
                method: 'GET',
                url: FUNIFIER_API_CONFIG.baseUrl + '/virtualgoods/item',
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json' }
            };
            return $http(req).then(function(response) {
                allVirtualGoods = response.data;
            });
        }

        function buildCompletedChallengesDisplay() {
            vm.completedChallengesDisplay = [];
            if (!playerStatus.challenges) return;
            console.log('playerStatus.challenges:', playerStatus.challenges);
            console.log('allChallenges:', allChallenges);
            Object.keys(playerStatus.challenges).forEach(function(challengeId) {
                var challenge = allChallenges.find(function(c) {
                    console.log('Comparing challenge catalog _id', c._id, 'with player challengeId', challengeId);
                    return c._id === challengeId;
                });
                if (challenge) {
                    vm.completedChallengesDisplay.push({
                        id: challenge._id,
                        name: challenge.challenge,
                        badge: challenge.badge && challenge.badge.small && challenge.badge.small.url,
                        misscoins: (challenge.points && Array.isArray(challenge.points) && challenge.points.find(function(p) { return p.category === 'misscoins'; })) ? challenge.points.find(function(p) { return p.category === 'misscoins'; }).total : 0,
                        description: challenge.description
                    });
                } else {
                    console.warn('Challenge not found for ID:', challengeId);
                }
            });
            console.log('vm.completedChallengesDisplay:', vm.completedChallengesDisplay);
            $timeout(function() { $scope.$applyAsync(); });
        }

        function buildPurchaseHistoryDisplay() {
            vm.purchaseHistoryDisplay = [];
            var catalogItems = playerStatus.catalog_items || {};
            console.log('playerStatus.catalog_items:', catalogItems);
            console.log('allVirtualGoods:', allVirtualGoods);
            Object.keys(catalogItems).forEach(function(itemId) {
                var item = allVirtualGoods.find(function(i) {
                    console.log('Comparing virtual good catalog _id', i._id, 'with player itemId', itemId);
                    return i._id === itemId;
                });
                if (item) {
                    vm.purchaseHistoryDisplay.push({
                        id: item._id,
                        name: item.name,
                        image: item.image && item.image.small && item.image.small.url,
                        misscoins: (item.requires && Array.isArray(item.requires) && item.requires.find(function(r) { return r.item === 'misscoins'; })) ? item.requires.find(function(r) { return r.item === 'misscoins'; }).total : 0,
                        description: item.description
                    });
                } else {
                    console.warn('Virtual good not found for ID:', itemId);
                }
            });
            $timeout(function() { $scope.$applyAsync(); });
        }

        function loadActivities() {
            ActivityService.getRecent()
                .then(function(response) {
                    vm.activities = response.data;
                    // Fallback: If completed challenges are not in playerStatus, try to extract from activities
                    if (!vm.completedChallenges.length && Array.isArray(vm.activities)) {
                        vm.completedChallenges = vm.activities.filter(function(act) {
                            return act.type === 'challenge' && act.status === 'completed';
                        });
                    }
                })
                .catch(function(error) {
                    console.error('Error loading activities:', error);
                });
        }

        function loadEvents() {
            EventService.getUpcoming()
                .then(function(response) {
                    vm.events = response.data;
                })
                .catch(function(error) {
                    console.error('Error loading events:', error);
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
    }
})(); 