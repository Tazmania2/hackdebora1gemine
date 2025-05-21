(function() {
    'use strict';

    angular
        .module('app')
        .controller('DashboardController', DashboardController);

    DashboardController.$inject = ['$scope', '$location', 'AuthService', 'PlayerService', 'EventService', 'ActivityService', '$http', 'FUNIFIER_API_CONFIG', '$timeout'];

    function DashboardController($scope, $location, AuthService, PlayerService, EventService, ActivityService, $http, FUNIFIER_API_CONFIG, $timeout) {
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

        // Methods
        vm.goToProfile = goToProfile;
        vm.goToRewards = goToRewards;
        vm.goToPurchases = goToPurchases;
        vm.shareOnSocial = shareOnSocial;
        vm.registerForEvent = registerForEvent;

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
            });
            loadActivities();
            loadEvents();
        }

        // --- Data holders for mapping ---
        var allChallenges = [];
        var allVirtualGoods = [];
        var playerStatus = {};

        function loadPlayerStatus() {
            return PlayerService.getStatus()
                .then(function(response) {
                    var data = response.data;
                    data.point_categories = data.point_categories || data.pointCategories || {};
                    vm.playerStatus = data;
                    playerStatus = data;
                    setReferralQrUrl();
                })
                .catch(function(error) {
                    vm.error = 'Erro ao carregar status do jogador';
                    console.error('Error loading player status:', error);
                });
        }

        function setReferralQrUrl() {
            var code = (playerStatus.extra && playerStatus.extra.mycode) ? playerStatus.extra.mycode : 'N0c()63';
            var baseUrl = window.location.origin + window.location.pathname;
            var url = baseUrl + '#!/register?referral=' + encodeURIComponent(code);
            $timeout(function() {
                vm.qrUrl = url;
                vm.qrReady = true;
                console.log('QR URL (timeout):', vm.qrUrl);
            });
        }

        function loadChallenges() {
            var req = {
                method: 'GET',
                url: FUNIFIER_API_CONFIG.baseUrl + '/challenge',
                headers: { 'Authorization': localStorage.getItem('token'), 'Content-Type': 'application/json' }
            };
            return $http(req).then(function(response) {
                allChallenges = response.data;
            });
        }

        function loadVirtualGoods() {
            var req = {
                method: 'GET',
                url: FUNIFIER_API_CONFIG.baseUrl + '/virtualgoods/item',
                headers: { 'Authorization': localStorage.getItem('token'), 'Content-Type': 'application/json' }
            };
            return $http(req).then(function(response) {
                allVirtualGoods = response.data;
            });
        }

        function buildCompletedChallengesDisplay() {
            vm.completedChallengesDisplay = [];
            if (!playerStatus.challenges) return;
            Object.keys(playerStatus.challenges).forEach(function(challengeId) {
                var challenge = allChallenges.find(function(c) { return c._id === challengeId; });
                if (challenge) {
                    // Find misscoins points
                    var misscoins = 0;
                    if (challenge.points && Array.isArray(challenge.points)) {
                        var mc = challenge.points.find(function(p) { return p.category === 'misscoins'; });
                        if (mc) misscoins = mc.total;
                    }
                    vm.completedChallengesDisplay.push({
                        name: challenge.challenge,
                        badge: challenge.badge && challenge.badge.small && challenge.badge.small.url,
                        misscoins: misscoins,
                        description: challenge.description
                    });
                }
            });
        }

        function buildPurchaseHistoryDisplay() {
            vm.purchaseHistoryDisplay = [];
            var catalogItems = playerStatus.catalog_items || {};
            Object.keys(catalogItems).forEach(function(itemId) {
                var item = allVirtualGoods.find(function(i) { return i._id === itemId; });
                if (item) {
                    // Find misscoins cost (from requires)
                    var misscoins = 0;
                    if (item.requires && Array.isArray(item.requires)) {
                        var req = item.requires.find(function(r) { return r.item === 'misscoins'; });
                        if (req) misscoins = req.total;
                    }
                    vm.purchaseHistoryDisplay.push({
                        name: item.name,
                        image: item.image && item.image.small && item.image.small.url,
                        misscoins: misscoins,
                        description: item.description
                    });
                }
            });
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
    }
})(); 