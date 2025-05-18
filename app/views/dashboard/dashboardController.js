(function() {
    'use strict';

    angular
        .module('app')
        .controller('DashboardController', DashboardController);

    DashboardController.$inject = ['$scope', '$location', 'AuthService', 'PlayerService', 'EventService', 'ActivityService'];

    function DashboardController($scope, $location, AuthService, PlayerService, EventService, ActivityService) {
        var vm = this;

        // Properties
        vm.playerStatus = {};
        vm.activities = [];
        vm.events = [];
        vm.loading = true;
        vm.error = null;

        // Methods
        vm.goToProfile = goToProfile;
        vm.goToRewards = goToRewards;
        vm.goToPurchases = goToPurchases;
        vm.shareOnSocial = shareOnSocial;
        vm.registerForEvent = registerForEvent;

        // Initialize
        activate();

        function activate() {
            loadPlayerStatus();
            loadActivities();
            loadEvents();
        }

        function loadPlayerStatus() {
            PlayerService.getStatus()
                .then(function(response) {
                    var data = response.data;
                    // Normalize point_categories for view compatibility
                    data.point_categories = data.point_categories || data.pointCategories || {};
                    vm.playerStatus = data;
                })
                .catch(function(error) {
                    vm.error = 'Erro ao carregar status do jogador';
                    console.error('Error loading player status:', error);
                })
                .finally(function() {
                    vm.loading = false;
                });
        }

        function loadActivities() {
            ActivityService.getRecent()
                .then(function(response) {
                    vm.activities = response.data;
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