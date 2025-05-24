(function() {
    'use strict';

    angular
        .module('app')
        .controller('CashbackCouponController', CashbackCouponController);

    CashbackCouponController.$inject = ['$scope', '$http', 'PlayerService', 'FUNIFIER_API_CONFIG', '$timeout', 'SuccessMessageService', 'ActivityService'];

    function CashbackCouponController($scope, $http, PlayerService, FUNIFIER_API_CONFIG, $timeout, SuccessMessageService, ActivityService) {
        // CLONED LOGIC FROM VirtualGoodsController - will be customized for cashback coupon logic
        var vm = this;
        // ... (rest of the logic will be filled in next step) ...
    }
})(); 