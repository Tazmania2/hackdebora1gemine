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
        vm.qrImgUrl = '';

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
            $location.path('/register-purchase');
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
            });
            loadActivities();
            loadEvents();
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
            var baseUrl = window.location.origin + window.location.pathname;
            var url = baseUrl + '#!/register?referral=' + encodeURIComponent(code);
            vm.qrUrl = url;
            // Generate QR code as data URL
            var qr = window.qrcode(4, 'L');
            qr.addData(url);
            qr.make();
            // Get the data URL from the generated QR code
            var qrImg = qr.createImgTag(8); // 8 = pixel size
            // Extract src from <img src="...">
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
    }
})(); 